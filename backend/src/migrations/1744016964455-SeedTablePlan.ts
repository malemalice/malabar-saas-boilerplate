import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTablePlan1744016964455 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO plans (name, price, features, "billingCycle", created_at) VALUES
            (
                'Free',
                0,
                '[
                    {"label": "Up to 5 team members", "metric": "member", "value": "5"},
                    {"label": "Up to 50 candidates", "metric": "candidate", "value": "50"},
                    {"label": "Basic quiz creation", "metric": "feature", "value": "basic"},
                    {"label": "Basic analytics", "metric": "feature", "value": "basic"}
                ]',
                'monthly',
                NOW()
            ),
            (
                'Premium',
                29.99,
                '[
                    {"label": "Up to 20 team members", "metric": "member", "value": "20"},
                    {"label": "Up to 200 candidates", "metric": "candidate", "value": "200"},
                    {"label": "Advanced quiz creation", "metric": "feature", "value": "advanced"},
                    {"label": "Advanced analytics", "metric": "feature", "value": "advanced"},
                    {"label": "Custom branding", "metric": "feature", "value": "enabled"},
                    {"label": "Priority support", "metric": "support", "value": "priority"}
                ]',
                'monthly',
                NOW()
            ),
            (
                'Enterprise',
                99.99,
                '[
                    {"label": "Unlimited team members", "metric": "member", "value": "unlimited"},
                    {"label": "Unlimited candidates", "metric": "candidate", "value": "unlimited"},
                    {"label": "Enterprise quiz creation", "metric": "feature", "value": "enterprise"},
                    {"label": "Enterprise analytics", "metric": "feature", "value": "enterprise"},
                    {"label": "Custom branding", "metric": "feature", "value": "enabled"},
                    {"label": "24/7 Priority support", "metric": "support", "value": "24/7"},
                    {"label": "API access", "metric": "api", "value": "enabled"},
                    {"label": "Custom integrations", "metric": "integration", "value": "custom"}
                ]',
                'monthly',
                NOW()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM plans 
            WHERE name IN ('Free', 'Premium', 'Enterprise')
        `);
    }
}
