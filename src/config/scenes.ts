export interface Scene {
  id: string;
  src: string;
  season: string;
  location: string;
  temperature: string;
  label: string;
  technicalLabel: string;
  headline: string;
  copy: string;
  cta: string;
  contentPosition: "left-center" | "left-lower" | "right-center" | "right-lower";
}

export const scenes: Scene[] = [
  {
    id: "spring",
    src: "/video/hero-spring.mp4",
    season: "Spring",
    location: "",
    temperature: "",
    label: "",
    technicalLabel: "TRIP INTELLIGENCE",
    headline: "PLAN FOR WHAT'S AHEAD.",
    copy: "Build your trip around distance, elevation, weather and the conditions ahead.",
    cta: "OPEN TRIP PLANNER →",
    contentPosition: "left-center",
  },
  {
    id: "summer",
    src: "/video/hero-summer.mp4",
    season: "Summer",
    location: "",
    temperature: "",
    label: "",
    technicalLabel: "PACK LAB",
    headline: "BUILD A LIGHTER PACK.",
    copy: "Analyze every item in your pack and see exactly where your weight is going.",
    cta: "OPEN PACK LAB →",
    contentPosition: "left-lower",
  },
  {
    id: "late-summer",
    src: "/video/hero-late-summer.mp4",
    season: "Late Summer",
    location: "",
    temperature: "",
    label: "",
    technicalLabel: "ULTRALIGHT INTELLIGENCE",
    headline: "EVERY GRAM EARNS ITS PLACE.",
    copy: "Optimize your complete hiking system without cutting the capability you actually need.",
    cta: "OPTIMIZE MY PACK →",
    contentPosition: "left-center",
  },
  {
    id: "fall",
    src: "/video/hero-fall.mp4",
    season: "Fall",
    location: "",
    temperature: "",
    label: "",
    technicalLabel: "ADAPTIVE PLANNING",
    headline: "PACK FOR THE CONDITIONS.",
    copy: "Adjust your system around temperature, precipitation, elevation and trip length.",
    cta: "ANALYZE MY TRIP →",
    contentPosition: "right-center",
  },
  {
    id: "winter",
    src: "/video/hero-winter.mp4",
    season: "Winter",
    location: "",
    temperature: "",
    label: "",
    technicalLabel: "SYSTEM ANALYSIS",
    headline: "KNOW YOUR SYSTEM.",
    copy: "Model warmth, weight and conditions before you ever reach the trailhead.",
    cta: "ANALYZE MY GEAR →",
    contentPosition: "left-lower",
  },
];
