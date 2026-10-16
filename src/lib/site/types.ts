export interface SiteHour {
  id: string;
  serviceType: string;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  crossesMidnight: boolean;
  active: boolean;
}

export interface SiteOverride {
  id: string;
  serviceDate: string;
  serviceType: string;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  reason: string;
}

export interface SiteTeamMember {
  name: string;
  role: string;
  description: string;
}

export interface SiteProfile {
  id: string;
  businessId: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImageUrl: string | null;
  aboutTitle: string;
  aboutDescription: string;
  aboutMission: string;
  aboutVision: string;
  aboutTeam: SiteTeamMember[];
  socialFacebookUrl: string | null;
  socialInstagramUrl: string | null;
  socialTikTokUrl: string | null;
  updatedAt: string;
}

export interface SiteContent {
  locationId: string;
  location: {
    id: string;
    businessId: string;
    name: string;
    addressLine: string;
    municipality: string;
    department: string;
    phone: string | null;
    email: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string;
  };
  hours: SiteHour[];
  overrides: SiteOverride[];
  profile: SiteProfile | null;
}
