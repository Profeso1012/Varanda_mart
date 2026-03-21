import person1 from "../assets/hero-person-1.jpg";
import person2 from "../assets/hero-person-2.jpg";
import triangle from "../assets/polygon-4.png";
import ellipse from "../assets/ellipse-12.png";
import './HeroImageGroup.css';

const HeroImageGroup = () => {
  return (
    <div className="hero-group-wrapper">
      {/* Person 1 - top left, sharp bottom-right corner */}
      <div className="hero-group-card hero-group-person-primary">
        <img
          src={person1}
          alt="Shop owner"
          className="hero-group-img"
        />
      </div>

      {/* Triangles cluster - plus/cross shape - wrapped in div for rotation */}
      <div className="hero-group-triangles-container">
        <img src={triangle} alt="" className="hero-group-triangle" />
        <img src={triangle} alt="" className="hero-group-triangle" />
        <img src={triangle} alt="" className="hero-group-triangle" />
        <img src={triangle} alt="" className="hero-group-triangle" />
      </div>

      {/* Person 2 - starts halfway down person 1, sharp top-right corner */}
      <div className="hero-group-card hero-group-person-secondary">
        <img
          src={person2}
          alt="Business owner with tablet"
          className="hero-group-img"
        />
      </div>

      {/* Ellipses - closer to second image - wrapped in div for spacing adjustment */}
      <div className="hero-group-ellipses-container">
        <img
          src={ellipse}
          alt=""
          className="hero-group-ellipse"
        />
        <img
          src={ellipse}
          alt=""
          className="hero-group-ellipse"
        />
      </div>
    </div>
  );
};

export default HeroImageGroup;
