import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Package, ShoppingBag, Store, Truck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../lib/axios';
import { getRouteForOnboarding } from '../../lib/authRoutes';

const ROLES = [
  {
    id: 'SELLER',
    icon: Store,
    title: 'Start Selling',
    subtitle: 'Create your online store and sell directly to customers.',
    cta: 'Start Selling for Free',
    accent: 'green',
    benefits: [
      { icon: Store, text: 'Your own storefront' },
      { icon: CreditCard, text: 'Accept payments securely' },
      { icon: Users, text: 'Manage orders & customers' },
    ],
  },
  {
    id: 'SUPPLIER',
    icon: Package,
    title: 'Become a Supplier',
    subtitle: 'Upload products and let sellers sell them for you.',
    cta: 'Start Supplying for Free',
    accent: 'blue',
    benefits: [
      { icon: ShoppingBag, text: 'List wholesale products' },
      { icon: Package, text: 'Manage inventory & stock' },
      { icon: Truck, text: 'Fulfill orders from sellers' },
    ],
  },
];

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { applyAuthPayload } = useAuth();

  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const syncAndContinue = async (fallbackRole) => {
    const me = await sellerApi.get('/auth/me');
    const payload = me.data.data;
    applyAuthPayload(payload);
    navigate(getRouteForOnboarding(payload.user || { role: fallbackRole }));
  };

  const handleContinue = async (roleId) => {
    if (loading) return;
    setSelectedRole(roleId);
    setLoading(true);
    setError(null);

    try {
      const { data } = await sellerApi.post('/auth/role/select', { role: roleId });
      await syncAndContinue(data.data.role || roleId);
    } catch (err) {
      if (err.response?.data?.error?.code === 'CONFLICT') {
        try {
          await syncAndContinue(roleId);
          return;
        } catch {
          // Fall through to the original API error if session sync fails.
        }
      }

      const message = err.response?.data?.error?.message;
      setError(message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F7F4] px-4 py-7 sm:px-6">
      <div className="mx-auto min-h-[calc(100vh-56px)] max-w-7xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <header className="flex items-center border-b border-gray-100 px-7 py-5">
          <img src="/varanda-logo.png" alt="Varanda Mart" className="h-10 object-contain" />
        </header>

        <main className="relative px-5 py-9 sm:px-8 lg:px-16">
          <div className="pointer-events-none absolute left-0 top-0 h-52 w-72 bg-linear-to-br from-green-200/70 via-green-100/40 to-transparent blur-2xl" />

          <div className="relative mx-auto max-w-5xl">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-[#22925B]">
                <Users size={24} />
              </div>
              <h1 className="text-3xl font-bold text-[#1F2A30]">
                How do you want to use Varanda?
              </h1>
              <p className="mt-3 text-sm text-[#5C5D86]">
                Choose how you want to get started. You can switch anytime.
              </p>
            </div>

            {error && (
              <p className="mx-auto mb-5 max-w-xl rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-[#E32323]">
                {error}
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.id;
                const accentColor = role.accent === 'blue' ? '#2F76D2' : '#22925B';
                const accentBg = role.accent === 'blue' ? 'bg-blue-50' : 'bg-green-50';

                return (
                  <article
                    key={role.id}
                    className={`rounded-lg border bg-white p-7 shadow-sm transition-all sm:p-9 ${
                      isActive ? 'border-[#22925B] ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`mb-5 flex h-24 w-24 items-center justify-center rounded-full ${accentBg}`}>
                        <Icon size={50} color={accentColor} strokeWidth={1.7} />
                      </div>
                      <h2 className="text-2xl font-bold text-[#1F2A30]">{role.title}</h2>
                      <p className="mt-2 max-w-64 text-sm leading-6 text-[#5C5D86]">{role.subtitle}</p>
                    </div>

                    <div className="my-6 h-px bg-gray-100" />

                    <div className="space-y-4">
                      {role.benefits.map((benefit) => {
                        const BenefitIcon = benefit.icon;
                        return (
                          <div key={benefit.text} className="flex items-center gap-4 text-sm text-[#1F2A30]">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${accentBg}`}>
                              <BenefitIcon size={16} color={accentColor} />
                            </span>
                            <span>{benefit.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleContinue(role.id)}
                      disabled={loading}
                      className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0E9B57] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0b8048] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading && isActive ? 'Setting up...' : role.cta}
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#5C5D86]">
              {['No coding required', 'Free to get started', 'Secure payments'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check size={13} className="text-[#22925B]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
