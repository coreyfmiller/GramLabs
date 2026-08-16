export interface Scene {
  id: string;
  src: string;
  season: string;
  location: string;
  temperature: string;
  label: string;
  poster?: string;
  mobileSrc?: string;
}

export const scenes: Scene[] = [
  {
    id: "spring",
    src: "/video/hero-spring.mp4",
    season: "Spring",
    location: "APPALACHIAN TRAIL",
    temperature: "48°F",
    label: "SPRING · 48°F",
  },
  {
    id: "summer",
    src: "/video/hero-summer.mp4",
    season: "Summer",
    location: "APPALACHIAN TRAIL",
    temperature: "76°F",
    label: "SUMMER · 76°F",
  },
  {
    id: "late-summer",
    src: "/video/hero-late-summer.mp4",
    season: "Late Summer",
    location: "APPALACHIAN HIGHLANDS",
    temperature: "68°F",
    label: "LATE SUMMER · 68°F",
  },
  {
    id: "fall",
    src: "/video/hero-fall.mp4",
    season: "Fall",
    location: "APPALACHIAN TRAIL",
    temperature: "47°F",
    label: "AUTUMN · 47°F",
  },
  {
    id: "winter",
    src: "/video/hero-winter.mp4",
    season: "Winter",
    location: "APPALACHIAN TRAIL",
    temperature: "21°F",
    label: "WINTER · 21°F",
  },
];
