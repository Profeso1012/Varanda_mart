import './WhoItsFor.css';

const ScissorsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="6" r="3" stroke="#22925B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="18" r="3" stroke="#22925B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" stroke="#22925B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShirtIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 001 .84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 001-.84l.58-3.57a2 2 0 00-1.35-2.23z" stroke="#22925B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="21" r="1" stroke="#22925B" strokeWidth="2"/>
    <circle cx="20" cy="21" r="1" stroke="#22925B" strokeWidth="2"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.98-1.69l1.6-9.31H6" stroke="#22925B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#22925B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12h6v10" stroke="#22925B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const categories = [
  {
    id: 'boutique',
    image: 'https://images.pexels.com/photos/5424922/pexels-photo-5424922.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    alt: 'Fabric and boutique clothing store interior',
    icon: <ScissorsIcon />,
    label: 'Fabric & Boutique Owners',
  },
  {
    id: 'fashion',
    image: 'https://images.pexels.com/photos/1381562/pexels-photo-1381562.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    alt: 'Fashion seller with handbag',
    icon: <ShirtIcon />,
    label: 'Fashion Sellers',
  },
  {
    id: 'vendors',
    image: 'https://images.pexels.com/photos/6169053/pexels-photo-6169053.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    alt: 'Online vendor with phone and packages',
    icon: <CartIcon />,
    label: 'Online Vendors',
  },
  {
    id: 'small-biz',
    image: 'https://images.pexels.com/photos/7289734/pexels-photo-7289734.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    alt: 'Small business owner packing orders',
    icon: <StoreIcon />,
    label: 'Small Businesses',
  },
];

const CategoryCard = ({ category }) => (
  <div className="who-card">
    <img
      src={category.image}
      alt={category.alt}
      className="who-card__image"
    />
    <div className="who-card__label">
      <span className="who-card__dot" />
      <span className="who-card__label-icon">{category.icon}</span>
      <span className="who-card__label-text">{category.label}</span>
    </div>
  </div>
);

const WhoItsFor = () => (
  <section className="who-section">
    <div className="who-section__header">
      <h2 className="who-section__title">Who it&apos;s for</h2>
      <p className="who-section__subtitle">
        Set up your store, manage inventory, and accept payments all in one place.
      </p>
    </div>
    <div className="who-section__grid">
      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  </section>
);

export default WhoItsFor;
