import './TrustStrip.css';

const TrustStrip = () => {
  return (
    <section className="trust-strip">
      <div className="trust-strip__amber-bg" />
      <div className="trust-strip__green-bg" />

      <div className="trust-strip__content">

        {/* Pill 1: No coding required — green border */}
        <div className="trust-pill trust-pill--green-border">
          <svg className="trust-pill__dot" width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#dot-f-1)">
              <circle cx="3" cy="3" r="3" fill="#F59E0B" fillOpacity="0.8"/>
            </g>
            <defs>
              <filter id="dot-f-1" x="-4" y="-4" width="14" height="14" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur"/>
              </filter>
            </defs>
          </svg>
          <div className="trust-pill__icon-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.1931 17.6001L11.5833 13.9903L10.4806 15.0921C9.35306 16.2214 8.78839 16.7852 8.18156 16.6523C7.57473 16.5194 7.29881 15.7695 6.74698 14.2726L4.90723 9.27678C3.80631 6.28936 3.25448 4.79611 4.02448 4.02611C4.79448 3.25611 6.28864 3.80611 9.27698 4.90795L14.2728 6.74678C15.7697 7.29861 16.5186 7.57453 16.6525 8.18136C16.7863 8.7882 16.2216 9.35195 15.0923 10.4804L13.9905 11.5831L17.6003 15.1929C17.9743 15.5669 18.1613 15.7539 18.2475 15.9629C18.3621 16.2407 18.3621 16.5524 18.2475 16.831C18.1613 17.0391 17.9743 17.2261 17.6003 17.6001C17.2263 17.9741 17.0393 18.1611 16.8303 18.2473C16.5523 18.3621 16.2402 18.3621 15.9622 18.2473C15.7541 18.1611 15.5681 17.9741 15.1931 17.6001Z" stroke="#22925B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="trust-pill__label">No coding required</span>
        </div>

        {/* Pill 2: Free storefront URL — white border (animated) */}
        <div className="trust-pill trust-pill--white-border">
          <svg className="trust-pill__dot" width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#dot-f-2)">
              <circle cx="3" cy="3" r="3" fill="#F59E0B"/>
            </g>
            <defs>
              <filter id="dot-f-2" x="-4" y="-4" width="14" height="14" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur"/>
              </filter>
            </defs>
          </svg>
          <div className="trust-pill__icon-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.9314 3.07543C15.465 1.53543 17.8272 1.41076 19.2086 2.79584C20.59 4.18093 20.4645 6.55418 18.9309 8.09418L16.7089 10.3244M9.21055 12.8333C7.82913 11.4473 7.95471 9.07501 9.48738 7.53593L11.4591 5.55684" stroke="#22925B" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12.7915 9.16675C14.172 10.5527 14.0473 12.9251 12.5137 14.4642L10.2917 16.6944L8.06974 18.9247C6.53615 20.4647 4.1739 20.5893 2.79249 19.2042C1.41107 17.8192 1.53665 15.4459 3.07024 13.9059L5.29224 11.6757" stroke="#22925B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="trust-pill__label">Free storefront URL included</span>
        </div>

        {/* Pill 3: Secure online payment — green border */}
        <div className="trust-pill trust-pill--green-border">
          <svg className="trust-pill__dot" width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#dot-f-3)">
              <circle cx="3" cy="3" r="3" fill="#F59E0B"/>
            </g>
            <defs>
              <filter id="dot-f-3" x="-4" y="-4" width="14" height="14" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur"/>
              </filter>
            </defs>
          </svg>
          <div className="trust-pill__icon-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.33301 9.16667V6.41667C7.33301 4.39083 8.97384 2.75 10.9997 2.75C13.0255 2.75 14.6663 4.39083 14.6663 6.41667V9.16667M10.9997 13.75C11.2428 13.75 11.4759 13.6534 11.6479 13.4815C11.8198 13.3096 11.9163 13.0764 11.9163 12.8333C11.9163 12.5902 11.8198 12.3571 11.6479 12.1852C11.4759 12.0132 11.2428 11.9167 10.9997 11.9167C10.7566 11.9167 10.5234 12.0132 10.3515 12.1852C10.1796 12.3571 10.083 12.5902 10.083 12.8333C10.083 13.0764 10.1796 13.3096 10.3515 13.4815C10.5234 13.6534 10.7566 13.75 10.9997 13.75ZM10.9997 13.75V16.5M6.04967 9.16667H15.9497C16.7563 9.16667 17.4163 9.82667 17.4163 10.6333V17.05C17.4163 18.26 16.4263 19.25 15.2163 19.25H6.78301C5.57301 19.25 4.58301 18.26 4.58301 17.05V10.6333C4.58301 9.82667 5.24301 9.16667 6.04967 9.16667Z" stroke="#22925B" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="trust-pill__label">Secure online payment</span>
        </div>

        {/* Pill 4: Built for African Businesses — white border (animated) */}
        <div className="trust-pill trust-pill--white-border trust-pill--shine-delay">
          <svg className="trust-pill__dot" width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#dot-f-4)">
              <circle cx="3" cy="3" r="3" fill="#F59E0B"/>
            </g>
            <defs>
              <filter id="dot-f-4" x="-4" y="-4" width="14" height="14" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur"/>
              </filter>
            </defs>
          </svg>
          <div className="trust-pill__icon-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 20.625C16.3157 20.625 20.625 16.3157 20.625 11C20.625 5.68426 16.3157 1.375 11 1.375C5.68426 1.375 1.375 5.68426 1.375 11C1.375 16.3157 5.68426 20.625 11 20.625Z" stroke="#22925B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.5008 18.8985C13.0516 17.9869 16.7499 15.7231 15.3852 14.0172C14.7807 13.2614 13.2417 12.0882 14.0047 10.7785C15.2204 8.69177 20.4023 9.34331 20.6258 11.0066" stroke="#22925B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.49135 18.0908C5.49986 17.1683 6.4766 16.2643 6.9774 15.0564C7.39822 14.0414 7.94174 12.6722 7.3054 11.7765C6.72138 10.9544 4.89603 11.9263 4.36381 11.0698C3.91708 10.3508 4.21744 8.75669 4.92551 8.59341C6.10365 8.32173 8.24986 9.94298 7.86536 8.41794C6.15742 4.66222 8.72015 5.49995 6.8748 2.30371" stroke="#22925B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.7569 7.0061C19.1291 6.60872 18.0812 6.23451 16.9549 6.2961C15.8286 6.35769 13.4715 7.70354 12.9453 6.4735C12.3064 4.97996 14.2559 2.91327 16.4636 3.10133" stroke="#22925B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="trust-pill__label">Built for African Businesses</span>
        </div>

      </div>
    </section>
  );
};

export default TrustStrip;
