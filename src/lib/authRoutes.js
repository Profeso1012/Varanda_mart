export const hasSellerProfile = (user) =>
  Boolean(user?.hasSellerProfile) || user?.role === 'SELLER' || user?.role === 'HYBRID';

export const hasSupplierProfile = (user) =>
  Boolean(user?.hasSupplierProfile) || user?.role === 'SUPPLIER' || user?.role === 'HYBRID';

export const isDeveloper = (user) =>
  Boolean(user?.hasDeveloperProfile) || user?.role === 'DEVELOPER';

export const getCompleteRoute = (user) => {
  if (hasSupplierProfile(user) && !hasSellerProfile(user)) return '/supplier';
  return '/dashboard';
};

export const getRouteForOnboarding = (user) => {
  switch (user?.onboardingStep) {
    case 'ROLE_SELECTION':
      return '/role/select';
    case 'PLAN_SELECTION':
      return '/pricing';
    case 'BUSINESS_SETUP':
      return hasSupplierProfile(user) && !hasSellerProfile(user) ? '/supplier/profile' : '/setup';
    case 'COMPLETE':
      return getCompleteRoute(user);
    default:
      return user?.role ? getCompleteRoute(user) : '/role/select';
  }
};
