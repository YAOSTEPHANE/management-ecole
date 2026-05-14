import type { AppBrandingPayload } from '@/contexts/AppBrandingContext';
import {
  TRANLEFET_OPENING_HOURS,
  TRANLEFET_SCHOOL,
  getGoogleMapsSearchUrl,
  getTranlefetSchoolMapsQuery,
} from '@/data/tranlefetSchool';

export type SchoolContactInfo = {
  name: string;
  address: string;
  phone: string;
  phoneTel: string;
  email: string | null;
  website: string | null;
  websiteHref: string | null;
  principal: string | null;
  mapsUrl: string;
  openingHoursSummary: string;
};

export function toTelHref(phone: string): string {
  const cleaned = phone.trim();
  if (!cleaned) return '';
  const digits = cleaned.replace(/[\s().-]/g, '');
  if (digits.startsWith('+')) return `tel:${digits}`;
  if (digits.startsWith('00')) return `tel:+${digits.slice(2)}`;
  return `tel:${digits}`;
}

function normalizeWebsiteHref(website: string): string {
  const trimmed = website.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function buildOpeningHoursSummary(): string {
  const wednesday = TRANLEFET_OPENING_HOURS.find((row) => row.day === 'Mercredi');
  const weekday = TRANLEFET_OPENING_HOURS.find((row) => row.day === 'Lundi');
  if (weekday && wednesday) {
    return `Lun. – ven. : ${weekday.hours} (mer. : ${wednesday.hours})`;
  }
  return 'Lundi – vendredi';
}

export function resolveSchoolContactInfo(branding: AppBrandingPayload): SchoolContactInfo {
  const name = branding.schoolDisplayName?.trim() || TRANLEFET_SCHOOL.fullName;
  const address =
    branding.schoolAddress?.trim() ||
    `${TRANLEFET_SCHOOL.city}, ${TRANLEFET_SCHOOL.country}`;
  const phone = branding.schoolPhone?.trim() || TRANLEFET_SCHOOL.phoneDisplay;
  const phoneTel = branding.schoolPhone?.trim()
    ? toTelHref(branding.schoolPhone)
    : TRANLEFET_SCHOOL.phoneTel;
  const email = branding.schoolEmail?.trim() || null;
  const websiteRaw = branding.schoolWebsite?.trim() || null;
  const websiteHref = websiteRaw ? normalizeWebsiteHref(websiteRaw) : null;
  const principal = branding.schoolPrincipal?.trim() || null;

  return {
    name,
    address,
    phone,
    phoneTel,
    email,
    website: websiteRaw,
    websiteHref,
    principal,
    mapsUrl: getGoogleMapsSearchUrl(getTranlefetSchoolMapsQuery(branding.schoolAddress)),
    openingHoursSummary: buildOpeningHoursSummary(),
  };
}
