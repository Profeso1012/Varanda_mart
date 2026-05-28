import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { sellerApi } from '../../lib/axios';

const PLAN_FEATURES = {
  STARTER: [
    '1 Product',
    'Limited Suppliers',
    'Basic Accounting',
    'Inventory Management',
    'Basic Catalog Management',
    'Basic Catalog',
    'Local Payments',
    'Customer Support',
  ],
  PRO: [
    'Everything in Starter plus',
    'Multi-item sync',
    'Accounting Reports',
    'Advanced Inventory Management',
    'Supplier Negotiation Assistance',
    'Automated Order Management',
    'International Payments',
    'Customer Support',
  ],
  GROWTH: [
    'Everything in Pro plus',
    'Up to 20 Additional Suppliers',
    'Bulk Catalog Updates',
    'Team Management',
    'Supplier Network Access',
    'Automation Tools',
    'Customer Support',
  ],
};

const TIER_CONFIG = {
  STARTER: {
    highlight: false,
    cta: 'Start Free Trial',
    order: 0,
  },
  PRO: {
    highlight: true,
    cta: 'Upgrade to Pro',
    order: 1,
  },
  GROWTH: {
    highlight: false,
    cta: 'Get Growth',
    order: 2,
  },
};

export default function PricingPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('MONTHLY');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await sellerApi.get('/plans');
        setPlans(data.data.plans || []);
      } catch {
        setPlans([
          { tier: 'STARTER', monthlyPriceUsd: 0, yearlyPriceUsd: 0, trialDays: 90 },
          { tier: 'PRO', monthlyPriceUsd: 6, yearlyPriceUsd: 60, trialDays: 30 },
          { tier: 'GROWTH', monthlyPriceUsd: 20, yearlyPriceUsd: 200, trialDays: 30 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = async (tier) => {
    setSelecting(tier);
    try {
      const { data } = await sellerApi.post('/subscriptions/select-plan', {
        tier,
        billingCycle: billing,
      });

      if (tier === 'STARTER') {
        navigate('/setup');
        return;
      }

      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'CONFLICT') {
        navigate('/setup');
      } else if (code === 'ROLE_REQUIRED') {
        navigate('/role/select');
      } else {
        alert('Something went wrong. Please try again.');
      }
    } finally {
      setSelecting(null);
    }
  };

  const displayPlans = [...plans]
    .sort((a, b) => (TIER_CONFIG[a.tier]?.order ?? 99) - (TIER_CONFIG[b.tier]?.order ?? 99))
    .map((plan) => ({
      ...plan,
      ...TIER_CONFIG[plan.tier],
      features: PLAN_FEATURES[plan.tier] || [],
      price: billing === 'MONTHLY'
        ? (plan.monthlyPriceUsd === 0 ? '$0' : `$${plan.monthlyPriceUsd}`)
        : (plan.yearlyPriceUsd === 0 ? '$0' : `$${plan.yearlyPriceUsd}`),
      period: billing === 'MONTHLY' ? 'Per month' : 'Per year',
    }));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <img src="/varanda-logo.png" alt="Varanda Mart" className="h-10 w-fit object-contain" />

        <main className="py-8 sm:py-10">
          <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1F2A30] sm:text-3xl">
                Choose a seller plan
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5C5D86]">
                Sellers need an active subscription before business setup. Start with the plan that fits your current store.
              </p>
            </div>

            <div className="flex w-fit items-center rounded-full bg-gray-200 p-1">
              {[
                { label: 'Monthly', value: 'MONTHLY' },
                { label: 'Yearly', value: 'YEARLY' },
              ].map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBilling(b.value)}
                  className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                    billing === b.value
                      ? 'bg-[#22925B] text-white shadow-sm'
                      : 'text-[#5C5D86] hover:text-[#1F2A30]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-lg bg-white" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayPlans.map((plan) => (
                <div
                  key={plan.tier}
                  className={`flex min-h-96 flex-col rounded-lg border p-6 shadow-sm ${
                    plan.highlight
                      ? 'border-[#22925B] bg-[#22925B] text-white'
                      : 'border-gray-100 bg-white text-[#1F2A30]'
                  }`}
                >
                  <h2 className={`mb-1 text-lg font-bold ${plan.highlight ? 'text-white' : 'text-[#1F2A30]'}`}>
                    {plan.tier.charAt(0) + plan.tier.slice(1).toLowerCase()}
                  </h2>

                  <p className={`mb-0.5 text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-[#1F2A30]'}`}>
                    {plan.price}
                  </p>
                  <p className={`mb-1 text-xs ${plan.highlight ? 'text-green-100' : 'text-[#5C5D86]'}`}>
                    {plan.period}
                  </p>

                  {plan.trialDays > 0 && (
                    <p className={`mb-4 text-xs ${plan.highlight ? 'text-green-100' : 'text-[#5C5D86]'}`}>
                      {plan.trialDays}-day free trial
                    </p>
                  )}

                  <p className={`mb-3 text-xs font-semibold ${plan.highlight ? 'text-green-100' : 'text-[#5C5D86]'}`}>
                    Features
                  </p>

                  <ul className="mb-8 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          plan.highlight ? 'bg-white/20' : 'bg-green-100'
                        }`}>
                          <Check size={9} strokeWidth={3} className={plan.highlight ? 'text-white' : 'text-[#22925B]'} />
                        </span>
                        <span className={plan.highlight ? 'text-white' : 'text-[#1F2A30]'}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.tier)}
                    disabled={!!selecting}
                    className={`mt-auto w-full rounded-full py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                      plan.highlight
                        ? 'bg-[#1a7a4a] text-white hover:bg-[#155f3a]'
                        : 'border border-gray-300 text-[#1F2A30] hover:bg-gray-50'
                    }`}
                  >
                    {selecting === plan.tier ? 'Please wait...' : plan.cta}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
