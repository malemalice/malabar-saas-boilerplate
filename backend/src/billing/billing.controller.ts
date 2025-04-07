import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleType } from '../role/role.entity';
import { BillingService } from './billing.service';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { PlanResponseDto, SubscriptionResponseDto, CreateSubscriptionDto, InvoiceResponseDto, PaymentResponseDto, ProcessPaymentDto } from './dto/billing.dto';

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

    @ApiOperation({ summary: 'Create a new subscription' })
    @ApiResponse({ status: 201, description: 'Subscription created successfully', type: SubscriptionResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Requires billing role' })
    @ApiResponse({ status: 404, description: 'Team or plan not found' })
    @Post('subscriptions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.BILLING)
    async createSubscription(
        @Request() req,
        @Body() data: CreateSubscriptionDto,
    ): Promise<Subscription> {
        return this.billingService.createSubscription(data.teamId, data.planId);
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

    @ApiOperation({ summary: 'Get team invoices' })
    @ApiResponse({ status: 200, description: 'Returns the team invoices', type: [InvoiceResponseDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Requires billing role' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    @Get('teams/:teamId/invoices')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.BILLING)
    async getTeamInvoices(@Param('teamId') teamId: string): Promise<Invoice[]> {
        return this.billingService.getTeamInvoices(teamId);
    }

    @ApiOperation({ summary: 'Process payment for invoice' })
    @ApiResponse({ status: 200, description: 'Payment processed successfully', type: PaymentResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Requires billing role' })
    @ApiResponse({ status: 404, description: 'Invoice not found' })
    @ApiResponse({ status: 400, description: 'Invoice is already paid' })
    @Post('invoices/:invoiceId/pay')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.BILLING)
    async processPayment(
        @Param('invoiceId') invoiceId: number,
        @Body() paymentData: ProcessPaymentDto,
    ): Promise<Payment> {
        return this.billingService.processPayment(invoiceId, paymentData);
    }
}