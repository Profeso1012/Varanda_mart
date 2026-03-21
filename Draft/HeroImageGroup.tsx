import person1 from "@/assets/hero-person-1.jpg";
import person2 from "@/assets/hero-person-2.jpg";
import triangle from "@/assets/polygon-4.png";
import ellipse from "@/assets/ellipse-12.png";

const HeroImageGroup = () => {
  return (
    <div className="relative w-[520px] h-[420px]">
      {/* Person 1 - top left, sharp bottom-right corner */}
      <div className="absolute top-0 left-0 w-[220px] h-[270px] overflow-hidden rounded-[48px_48px_48px_0px]">
        <img
          src={person1}
          alt="Shop owner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Triangles cluster - plus/cross shape */}
      {/* Top center */}
      <img src={triangle} alt="" className="absolute top-[0px] left-[296px] w-[44px] h-[36px]" />
      {/* Middle left */}
      <img src={triangle} alt="" className="absolute top-[36px] left-[274px] w-[44px] h-[36px]" />
      {/* Middle right */}
      <img src={triangle} alt="" className="absolute top-[36px] left-[318px] w-[44px] h-[36px]" />
      {/* Bottom center */}
      <img src={triangle} alt="" className="absolute top-[72px] left-[296px] w-[44px] h-[36px]" />

      {/* Person 2 - starts halfway down person 1, sharp top-right corner */}
      <div className="absolute top-[135px] right-0 w-[240px] h-[290px] overflow-hidden rounded-[48px_0px_48px_48px]">
        <img
          src={person2}
          alt="Business owner with tablet"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Ellipses - closer to second image */}
      <img
        src={ellipse}
        alt=""
        className="absolute bottom-[10px] left-[170px] w-[36px] h-[64px]"
      />
      <img
        src={ellipse}
        alt=""
        className="absolute bottom-[10px] left-[212px] w-[36px] h-[64px]"
      />
    </div>
  );
};

export default HeroImageGroup;
