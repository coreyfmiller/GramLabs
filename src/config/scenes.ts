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
    location: "APPALACHIAN TRAIL",
    temperature: "48°F",
    label: "SPRING · 48°F",
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
    location: "APPALACHIAN TRAIL",
    temperature: "76°F",
    label: "SUMMER · 76°F",
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
    location: "APPALACHIAN HIGHLANDS",
    temperature: "68°F",
    label: "LATE SUMMER · 68°F",
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
    location: "APPALACHIAN TRAIL",
    temperature: "47°F",
    label: "AUTUMN · 47°F",
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
    location: "APPALACHIAN TRAIL",
    temperature: "21°F",
    label: "WINTER · 21°F",
    technicalLabel: "SYSTEM ANALYSIS",
    headline: "KNOW YOUR SYSTEM.",
    copy: "Model warmth, weight and conditions before you ever reach the trailhead.",
    cta: "ANALYZE MY GEAR →",
    contentPosition: "left-lower",
  },
];
