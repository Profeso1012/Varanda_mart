import bgImage from "@/assets/frame-219.png";
import HeroImageGroup from "@/components/HeroImageGroup";

const Index = () => {
  return (
    <div
      className="min-h-screen bg-no-repeat bg-cover bg-center flex items-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="container mx-auto px-8 flex items-center justify-between">
        {/* Left side - text and buttons placeholder */}
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-foreground">
            Empowering Small Businesses Everywhere
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tools and resources to help you grow, manage, and thrive.
          </p>
          {/* Buttons will go here later */}
        </div>

        {/* Right side - image group */}
        <HeroImageGroup />
      </div>
    </div>
  );
};

export default Index;
