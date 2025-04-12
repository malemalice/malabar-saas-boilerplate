import { Controller, Get, Post, Body, Param, UseGuards, Request, Headers, RawBodyRequest, Res, Req, NotFoundException, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleType } from '../role/role.entity';
import { BillingService } from './billing.service';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { PlanResponseDto, SubscriptionResponseDto, CreateSubscriptionDto, InvoiceResponseDto, PaymentResponseDto, ProcessPaymentDto, PaginatedInvoiceResponseDto } from './dto/billing.dto';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
    @ApiOperation({ summary: 'Get all available plans' })
    @ApiResponse({ status: 200, description: 'Returns all plans', type: [PlanResponseDto] })
    @Get('plans')
    async getAllPlans(): Promise<Plan[]> {
        return this.billingService.getAllPlans();
    }
    constructor(private readonly billingService: BillingService) {}

    @ApiOperation({ summary: 'Get plan by ID' })
    @ApiResponse({ status: 200, description: 'Returns the plan details', type: PlanResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Plan not found' })
    @Get('plans/:id')
    async getPlan(@Param('id') id: number): Promise<Plan> {
        return this.billingService.getPlan(id);
    }

    @ApiOperation({ summary: 'Create a new subscription and get Stripe checkout URL' })
    @ApiResponse({ status: 201, description: 'Subscription created successfully with checkout URL', type: SubscriptionResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Requires billing role' })
    @ApiResponse({ status: 404, description: 'Team or plan not found' })
    @Post('subscriptions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(RoleType.BILLING, RoleType.OWNER)
    async createSubscription(
        @Request() req,
        @Body() data: CreateSubscriptionDto,
    ): Promise<{ subscription: Subscription; checkoutUrl: string }> {
        return this.billingService.createSubscription(data.teamId, data.planId, data.paymentMethod);
    }

    @ApiOperation({ summary: 'Repay unpaid invoice' })
    @ApiResponse({ status: 200, description: 'Invoice repaid successfully', type: SubscriptionResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Requires billing role' })
    @ApiResponse({ status: 404, description: 'Invoice not found' })
    @Post('invoices/:invoiceId/repay')
    @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(RoleType.BILLING, RoleType.OWNER)
    async repayInvoice(@Param('invoiceId') invoiceId: string): Promise<{ subscription: Subscription; checkoutUrl: string }> {
        return this.billingService.repayInvoice(invoiceId);
    }

    @ApiOperation({ summary: 'Get team subscription' })
    @ApiResponse({ status: 200, description: 'Returns the team subscription', type: SubscriptionResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Requires billing role' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    @Get('teams/:teamId/subscription')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.BILLING)
    async getTeamSubscription(@Param('teamId') teamId: string): Promise<Subscription> {
        return this.billingService.getTeamSubscription(teamId);
    }

    @ApiOperation({ summary: 'Get team invoices with pagination' })
    @ApiResponse({ status: 200, description: 'Returns paginated team invoices', type: PaginatedInvoiceResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Requires billing role' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    @Get('teams/:teamId/invoices')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.BILLING, RoleType.OWNER)
    async getTeamInvoices(
        @Param('teamId') teamId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<PaginatedInvoiceResponseDto> {
        if (limit > 100) limit = 100; // Maximum limit per page
        const result = await this.billingService.getTeamInvoices(teamId, { page, limit });
        
        return {
            items: result.items.map(invoice => ({
                id: invoice.id,
                teamId: invoice.teamId,
                subscriptionId: invoice.subscription?.id,
                planId: invoice.subscription?.plan?.id,
                planName: invoice.subscription?.plan?.name,
                amount: invoice.amount,
                status: invoice.status,
                issuedDate: invoice.createdAt,
                dueDate: invoice.dueDate
            })),
            meta: {
                currentPage: result.page,
                itemsPerPage: result.limit,
                totalItems: result.total,
                totalPages: Math.ceil(result.total / result.limit),
                hasNextPage: result.page * result.limit < result.total,
                hasPreviousPage: result.page > 1
            }
        };
    }

    @ApiOperation({ summary: 'Get team active plan' })
    @ApiResponse({ status: 200, description: 'Returns the team active plan', type: PlanResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Requires billing role' })
    @ApiResponse({ status: 404, description: 'Team not found or no active plan' })
    @Get('teams/:teamId/active-plan')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getTeamActivePlan(@Param('teamId') teamId: string): Promise<Plan> {
        const subscription = await this.billingService.getTeamSubscription(teamId);
        if (!subscription || !subscription.plan) {
            throw new NotFoundException('No active plan found for the team');
        }
        return subscription.plan;
    }

    @ApiOperation({ summary: 'Handle Stripe webhook events' })
    @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
    @ApiHeader({ name: 'stripe-signature', description: 'Stripe webhook signature' })
    @Post('webhook/stripe')
    async handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response
    ): Promise<void> {
        try {
            await this.billingService.handleStripeWebhook(req.rawBody, signature);
            res.status(200).send();
        } catch (err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }
}