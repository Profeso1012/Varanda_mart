import './HowItWorks.css';

const WavyConnector1 = () => (
  <svg className="how-it-works__connector" width="178" height="41" viewBox="0 0 178 41" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_f_76_484)">
      <path d="M0 15.2199C69.5144 -44.4103 160 96.0333 178 15.2199" stroke="#F59E0B" strokeWidth="2" strokeDasharray="7 7"/>
    </g>
    <defs>
      <filter id="filter0_f_76_484" x="-4.65137" y="-5" width="187.628" height="51.0046" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur_76_484"/>
      </filter>
    </defs>
  </svg>
);

const WavyConnector2 = () => (
  <svg className="how-it-works__connector" width="178" height="53" viewBox="0 0 178 53" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_f_76_497)">
      <path d="M0 22.8888C42 -60.9414 117.143 119.79 178 22.8888" stroke="#F59E0B" strokeWidth="2" strokeDasharray="7 7"/>
    </g>
    <defs>
      <filter id="filter0_f_76_497" x="-4.89453" y="-4.9967" width="187.741" height="62.3058" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur_76_497"/>
      </filter>
    </defs>
  </svg>
);

const steps = [
  {
    number: '1',
    img: 'https://api.builder.io/api/v1/image/assets/TEMP/91c666fb0301ceb0b66e64eaa195ca047f983596?width=160',
    imgAlt: 'Profile icon',
    imgSize: 80,
    title: 'Create your profile',
    description: 'Sign up and instantly get your own storefront link.',
  },
  {
    number: '2',
    img: 'https://api.builder.io/api/v1/image/assets/TEMP/b89441390adeb2377df823e107a26fe7c476fb7f?width=180',
    imgAlt: 'Product icon',
    imgSize: 90,
    title: 'Add your products',
    description: 'Upload photos, prices, and descriptions in minutes.',
  },
  {
    number: '3',
    img: 'https://api.builder.io/api/v1/image/assets/TEMP/e8b69cffe4ca4d8b7f3cce84c1d87d55a9ce6d21?width=180',
    imgAlt: 'Sell icon',
    imgSize: 90,
    title: 'Start selling',
    description: 'Share your store link and receive payments securely online while we help with delivery and tracking',
  },
];

const HowItWorks = () => {
  return (
    <section className="how-it-works">
      <div className="how-it-works__header">
        <h2 className="how-it-works__title">How Varanda Works</h2>
        <p className="how-it-works__subtitle">
          Set up your store, manage inventory, and accept payments all in one place.
        </p>
      </div>

      <div className="how-it-works__steps">
        {steps.map((step, index) => (
          <div key={step.number} className="how-it-works__step-group">
            <div className="how-it-works__step">
              <div className="how-it-works__step-top">
                <div className="how-it-works__step-badge">{step.number}</div>
                <div className="how-it-works__icon-circle">
                  <img
                    src={step.img}
                    alt={step.imgAlt}
                    className="how-it-works__icon-img"
                    style={{ width: step.imgSize, height: step.imgSize }}
                  />
                </div>
              </div>
              <div className="how-it-works__step-body">
                <h3 className="how-it-works__step-title">{step.title}</h3>
                <p className="how-it-works__step-desc">{step.description}</p>
              </div>
            </div>

            {index === 0 && <WavyConnector1 />}
            {index === 1 && <WavyConnector2 />}
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
