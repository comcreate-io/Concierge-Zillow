import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'
import { QuoteWithItems, PDFCustomization, ServiceOverride } from '@/lib/actions/quotes'

// Register fonts for clean typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
})

// Clean white color palette - ticket style
const colors = {
  white: '#ffffff',
  background: '#f8f8f8',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  accent: '#3b82f6', // Blue accent for locations
  badgeBg: 'rgba(0, 0, 0, 0.6)', // Semi-transparent dark for badge
  navyDark: '#1a2332', // Dark navy for yacht design
  navyMedium: '#2a3a4a', // Medium navy
}

// Logo URL - using the black logo for white PDF background
const LOGO_URL = 'https://res.cloudinary.com/dku1gnuat/image/upload/v1765826144/concierge/CL_Black_LOGO.png'

// Header image URL
const HEADER_IMAGE_URL = 'https://res.cloudinary.com/dku1gnuat/image/upload/v1767127062/invoiceImage_lcy4qm.png'

// Yacht hero image URL (lifestyle items - passport, watch, compass, etc.)
const YACHT_HERO_IMAGE_URL = 'https://res.cloudinary.com/dku1gnuat/image/upload/v1767891666/yacht_header01_vwasld.png'

// Car hero image URL (car keys, sunglasses, passport)
const CAR_HERO_IMAGE_URL = 'https://res.cloudinary.com/dku1gnuat/image/upload/v1767891667/carss_1_q4pubs.png'

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.text,
  },
  // Header image container
  headerImageContainer: {
    position: 'relative',
    height: 100,
  },
  headerImage: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  // Header overlay on image
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Main ticket container
  ticketContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  // Top Header with Logo
  topHeader: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 2,
    marginLeft: 10,
  },
  quoteInfo: {
    alignItems: 'flex-end',
  },
  quoteNumber: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quoteDate: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  // Header
  header: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconWrapper: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // Client info
  clientSection: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  clientLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
  },
  clientEmail: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Service option card
  optionCard: {
    backgroundColor: colors.white,
    borderBottomWidth: 8,
    borderBottomColor: colors.borderLight,
  },
  // Image section
  imageContainer: {
    position: 'relative',
    width: 220,
    height: 140,
    overflow: 'hidden',
  },
  serviceImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 220,
    height: 'auto',
  },
  // Badge overlay on image
  nameBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.badgeBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameBadgeArrow: {
    color: colors.white,
    fontSize: 8,
    marginRight: 4,
  },
  nameBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: 600,
  },
  // Passenger badge
  passengerBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerText: {
    color: colors.text,
    fontSize: 8,
    fontWeight: 500,
  },
  // Trip details section
  tripDetails: {
    padding: 20,
    backgroundColor: colors.white,
  },
  dateText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  // Route section with codes
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  routeEndpoint: {
    flex: 1,
  },
  routeEndpointLeft: {
    alignItems: 'flex-start',
  },
  routeEndpointRight: {
    alignItems: 'flex-end',
  },
  routeCode: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.text,
  },
  routeLocation: {
    fontSize: 8,
    color: colors.accent,
    marginTop: 2,
  },
  // Route middle section (duration and arrow)
  routeMiddle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  durationText: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 4,
  },
  routeArrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  routeArrow: {
    fontSize: 10,
    color: colors.textMuted,
    marginHorizontal: 8,
  },
  // Price section
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 14,
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.text,
  },
  priceLabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Footer
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 3,
    marginBottom: 4,
  },
  footerTagline: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  footerContact: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 6,
  },
  // Notes section
  notesSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  notesLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  // Terms section
  termsSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  termsTitle: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  termsText: {
    fontSize: 7,
    color: colors.textMuted,
    lineHeight: 1.5,
  },
  // Description (fallback when no route details)
  description: {
    fontSize: 9,
    color: colors.textSecondary,
    lineHeight: 1.5,
    marginBottom: 14,
  },
  // Generic details grid (fallback)
  detailsGrid: {
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 8,
    color: colors.textMuted,
    width: 80,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 9,
    color: colors.text,
    fontWeight: 500,
    flex: 1,
  },
  // ==================== YACHT-SPECIFIC STYLES ====================
  yachtPage: {
    backgroundColor: colors.white,
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.text,
  },
  yachtContainer: {
    backgroundColor: colors.white,
  },
  // Yacht hero section
  yachtHero: {
    position: 'relative',
    height: 200,
  },
  yachtHeroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  yachtLogoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yachtLogo: {
    width: 100,
    height: 100,
    marginBottom: 6,
  },
  yachtCompanyName: {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    letterSpacing: 2.5,
  },
  yachtBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.navyDark,
    paddingVertical: 12,
    alignItems: 'center',
  },
  yachtBannerText: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 1.5,
  },
  // Yacht client info section
  yachtClientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 20,
  },
  yachtClientBox: {
    alignItems: 'flex-start',
  },
  yachtClientLabelBox: {
    backgroundColor: colors.text,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 8,
  },
  yachtClientLabel: {
    fontSize: 8,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yachtClientName: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 3,
  },
  yachtClientEmail: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  yachtDateBox: {
    alignItems: 'flex-end',
  },
  yachtDateLabelBox: {
    backgroundColor: colors.text,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 8,
  },
  yachtDateLabel: {
    fontSize: 8,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yachtDate: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 3,
  },
  yachtQuoteNum: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  // Dotted separator
  yachtDottedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderStyle: 'dashed',
    marginHorizontal: 40,
    marginVertical: 8,
  },
  // Yacht route section
  yachtRouteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 40,
    gap: 24,
  },
  yachtRouteLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  yachtRouteText: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.text,
  },
  yachtRouteArrow: {
    fontSize: 18,
    color: colors.textMuted,
    marginHorizontal: 0,
  },
  yachtRouteColumn: {
    alignItems: 'center',
  },
  // Yacht name header
  yachtNameSection: {
    backgroundColor: colors.navyDark,
    paddingVertical: 24,
    alignItems: 'center',
  },
  yachtNameText: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 1.2,
    letterSpacing: 1.5,
  },
  // Yacht main image
  yachtMainImageContainer: {
    position: 'relative',
    width: 535,
    height: 220,
    overflow: 'hidden',
  },
  yachtMainImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 535,
    height: 'auto',
  },
  // Description banner
  yachtDescBanner: {
    position: 'relative',
    backgroundColor: colors.navyDark,
    paddingVertical: 14,
    paddingHorizontal: 50,
    alignItems: 'center',
  },
  yachtDescText: {
    fontSize: 11,
    color: colors.white,
    textAlign: 'center',
    zIndex: 1,
  },
  yachtDescChevronLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 30,
    height: '100%',
    backgroundColor: colors.white,
  },
  yachtDescChevronRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
    height: '100%',
    backgroundColor: colors.white,
  },
  // Details section with two columns
  yachtDetailsSection: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical: 32,
    gap: 20,
  },
  yachtDetailsLeft: {
    flex: 1,
  },
  yachtDetailsRight: {
    width: 220,
  },
  yachtDetailItem: {
    marginBottom: 20,
  },
  yachtDetailLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  yachtDetailValue: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
  },
  yachtServicesList: {
    marginTop: 6,
  },
  yachtServicesItem: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 4,
  },
  yachtSecondaryImageContainer: {
    position: 'relative',
    width: 220,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  yachtSecondaryImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 220,
    height: 'auto',
  },
  yachtImageContainer: {
    position: 'relative',
  },
  yachtPassengerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yachtPassengerBadgeIcon: {
    fontSize: 10,
    color: colors.text,
  },
  yachtPassengerBadgeText: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.text,
  },
  // Additional text section
  yachtAdditionalText: {
    paddingHorizontal: 50,
    paddingTop: 24,
    paddingBottom: 0,
    backgroundColor: colors.white,
  },
  yachtAdditionalTextContent: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 1.6,
    textAlign: 'center',
  },
  // Yacht price section (below secondary image)
  yachtPriceSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  yachtPriceAmount: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 4,
  },
  yachtPriceLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Horizontal separator
  yachtSeparatorLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: 40,
    marginTop: 30,
    marginBottom: 20,
  },
  // Yacht notes
  yachtNotesSection: {
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  yachtNotesLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  yachtNotesText: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  // Yacht footer
  yachtFooter: {
    backgroundColor: colors.navyDark,
    paddingVertical: 28,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 0,
  },
  yachtFooterBrand: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 2.5,
    marginBottom: 5,
  },
  yachtFooterTagline: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  yachtFooterValidity: {
    fontSize: 10,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  yachtFooterContact: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },

  // ==================== CAR STYLES ====================
  carPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  carContainer: {
    backgroundColor: colors.white,
  },
  // Car hero section
  carHero: {
    position: 'relative',
    height: 280,
    backgroundColor: '#f5f5f5',
  },
  carHeroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  carLogoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 70,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carLogo: {
    width: 120,
    height: 120,
    objectFit: 'contain',
  },
  carBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.navyDark,
    paddingVertical: 16,
    alignItems: 'center',
  },
  carBannerText: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  // Car client section
  carClientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 40,
  },
  carClientBox: {
    flex: 1,
  },
  carClientLabelBox: {
    backgroundColor: colors.text,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  carClientLabel: {
    fontSize: 8,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: 600,
  },
  carClientName: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 3,
  },
  carClientEmail: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  carDateBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  carDateLabelBox: {
    backgroundColor: colors.text,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  carDateLabel: {
    fontSize: 8,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: 600,
  },
  carDate: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 3,
    textAlign: 'right',
  },
  carQuoteNum: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  // Car route section
  carRouteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 40,
    gap: 20,
  },
  carRouteLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  carRouteText: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.text,
    textTransform: 'uppercase',
  },
  carRouteArrow: {
    fontSize: 16,
    color: colors.textMuted,
    marginHorizontal: 0,
  },
  carRouteColumn: {
    alignItems: 'center',
  },
  // Car name header
  carNameSection: {
    backgroundColor: colors.navyDark,
    paddingVertical: 20,
    paddingHorizontal: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carNameLeft: {
    flex: 1,
  },
  carNameText: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 2,
  },
  carModelText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  carPassengersText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 600,
  },
  // Car main image with label overlay
  carImageContainer: {
    position: 'relative',
    width: 595,
    height: 280,
    overflow: 'hidden',
  },
  carMainImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 595,
    height: 'auto',
  },
  carImageLabel: {
    position: 'absolute',
    top: 30,
    left: 30,
    backgroundColor: colors.navyDark,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  carImageLabelIcon: {
    width: 4,
    height: 4,
    backgroundColor: colors.white,
    borderRadius: 2,
    marginRight: 8,
  },
  carImageLabelText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: 600,
  },
  // Car details and content section
  carContentSection: {
    flexDirection: 'row',
    paddingVertical: 35,
    paddingHorizontal: 50,
    gap: 35,
  },
  carContentLeft: {
    flex: 1,
  },
  carDetailItem: {
    marginBottom: 18,
  },
  carDetailLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  carDetailValue: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
  },
  carDescText: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.65,
    marginTop: 20,
    textAlign: 'left',
  },
  carContentRight: {
    width: 220,
  },
  carSecondaryImageContainer: {
    position: 'relative',
    width: 220,
    height: 180,
    marginBottom: 20,
    overflow: 'hidden',
  },
  carSecondaryImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 220,
    height: 'auto',
  },
  // Car price box
  carPriceBox: {
    backgroundColor: '#f9fafb',
    padding: 20,
    alignItems: 'center',
  },
  carPriceAmount: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 4,
  },
  carPriceLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Car separator
  carSeparatorLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginHorizontal: 40,
    marginVertical: 20,
  },
  // Car notes section
  carNotesSection: {
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  carNotesLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  carNotesText: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  // Car footer
  carFooter: {
    backgroundColor: colors.navyDark,
    paddingVertical: 28,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 0,
  },
  carFooterBrand: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 2.5,
    marginBottom: 5,
  },
  carFooterTagline: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  carFooterValidity: {
    fontSize: 10,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  carFooterContact: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
})

interface QuotePDFBuilderProps {
  quote: QuoteWithItems
  customization?: PDFCustomization | null
  companyInfo?: {
    name?: string
    tagline?: string
    phone?: string
    email?: string
    website?: string
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function QuotePDFBuilder({ quote, customization, companyInfo }: QuotePDFBuilderProps) {
  const company = {
    name: companyInfo?.name || 'CADIZ & LLUIS',
    tagline: companyInfo?.tagline || 'LUXURY LIVING',
    phone: companyInfo?.phone || '+1 (555) 123-4567',
    email: companyInfo?.email || 'brody@cadizlluis.com',
    website: companyInfo?.website || 'www.cadizlluis.com',
  }

  // Helper to get service override
  const getServiceOverride = (serviceId: string): ServiceOverride | undefined => {
    return customization?.service_overrides?.[serviceId]
  }

  // Helper to get images to display (max 2)
  const getDisplayImages = (serviceId: string, originalImages: string[]): string[] => {
    const override = getServiceOverride(serviceId)
    if (override?.display_images && override.display_images.length > 0) {
      return override.display_images.slice(0, 2)
    }
    return (originalImages || []).slice(0, 2)
  }

  // Default terms
  const defaultTerms = `• All services are subject to availability at time of booking
• A deposit may be required to confirm your reservation
• Cancellation policies vary by service type
• Additional fees may apply for special requests or modifications
• Insurance and liability requirements apply to certain services`

  // Check if service has ticket-style route details
  const hasRouteDetails = (details: { label: string; value: string }[] | undefined): boolean => {
    if (!details) return false
    return details.some(d => d.label === 'Departure Code' || d.label === 'Arrival Code')
  }

  // Check if this is a yacht quote
  const isYachtQuote = customization?.header_icon === 'yacht'

  // ==================== YACHT LAYOUT ====================
  if (isYachtQuote) {
    // Extract route info
    const departurePort = customization?.route?.departure_city || 'MIAMI'
    const destination = customization?.route?.arrival_city || 'BAHAMAS'

    // Additional text (like "This boat has been used exclusively...")
    const additionalText = customization?.custom_notes || ''

    return (
      <Document>
        <Page size="A4" style={styles.yachtPage}>
          <View style={styles.yachtContainer}>
            {/* Hero Section with Logo */}
            <View style={styles.yachtHero}>
              <Image src={YACHT_HERO_IMAGE_URL} style={styles.yachtHeroImage} />
              <View style={styles.yachtLogoOverlay}>
                <Image src={LOGO_URL} style={styles.yachtLogo} />
              </View>
              <View style={styles.yachtBanner}>
                <Text style={styles.yachtBannerText}>PRIVATE YACHT PROPOSAL</Text>
              </View>
            </View>

            {/* Client Info and Date */}
            <View style={styles.yachtClientSection}>
              <View style={styles.yachtClientBox}>
                <View style={styles.yachtClientLabelBox}>
                  <Text style={styles.yachtClientLabel}>Prepared for:</Text>
                </View>
                <Text style={styles.yachtClientName}>{quote.client_name}</Text>
                <Text style={styles.yachtClientEmail}>{quote.client_email}</Text>
              </View>
              <View style={styles.yachtDateBox}>
                <View style={styles.yachtDateLabelBox}>
                  <Text style={styles.yachtDateLabel}>Date:</Text>
                </View>
                <Text style={styles.yachtDate}>{formatDate(quote.created_at)}</Text>
                <Text style={styles.yachtQuoteNum}>{quote.quote_number}</Text>
              </View>
            </View>

            {/* Dotted Line */}
            <View style={styles.yachtDottedLine} />

            {/* Loop through all yacht service items (max 5) */}
            {quote.service_items && quote.service_items.length > 0 && quote.service_items.slice(0, 5).map((serviceItem, idx) => {
              if (!serviceItem) return null

              const override = getServiceOverride(serviceItem.id || '')
              const displayImages = getDisplayImages(serviceItem.id || '', serviceItem.images || [])
              const displayName = override?.display_name || serviceItem.service_name || 'Yacht Charter'
              const displayDescription = override?.display_description || serviceItem.description || ''
              const passengers = override?.passengers || '15'
              const duration = override?.flight_time || '8h'
              const servicesList = override?.services_list || ['Crew & amenities', 'Catering & beverages']
              // Get route info for this yacht (use override if exists, otherwise use global)
              const yachtDeparture = override?.departure_city || customization?.route?.departure_city || 'MIAMI'
              const yachtDestination = override?.arrival_city || customization?.route?.arrival_city || 'BAHAMAS'

              return (
                <View key={serviceItem.id} style={{ marginTop: idx > 0 ? 30 : 0 }}>
                  {/* Yacht Name */}
                  <View style={styles.yachtNameSection}>
                    <Text style={styles.yachtNameText}>{displayName}</Text>
                  </View>

                  {/* Main Yacht Image */}
                  {displayImages[0] && (
                    <View style={styles.yachtMainImageContainer}>
                      <Image src={displayImages[0]} style={styles.yachtMainImage} />
                    </View>
                  )}

                  {/* Description Banner */}
                  {displayDescription && (
                    <View style={{ position: 'relative' }}>
                      {/* White background layer only at bottom */}
                      <View style={{
                        backgroundColor: colors.navyDark,
                        paddingVertical: 14,
                        paddingHorizontal: 40,
                        paddingBottom: 20,
                      }}>
                        <Text style={styles.yachtDescText}>{displayDescription}</Text>
                      </View>
                      {/* White chevron cutout at bottom */}
                      <View style={{
                        backgroundColor: colors.white,
                        height: 20,
                        marginTop: -20,
                        marginHorizontal: 20,
                      }} />
                    </View>
                  )}

                  {/* Details Section with Two Columns */}
                  <View style={styles.yachtDetailsSection}>
                    {/* Left Column - Details */}
                    <View style={styles.yachtDetailsLeft}>
                      <View style={styles.yachtDetailItem}>
                        <Text style={styles.yachtDetailLabel}>ROUTE</Text>
                        <Text style={styles.yachtDetailValue}>{yachtDeparture} → {yachtDestination}</Text>
                      </View>
                      <View style={styles.yachtDetailItem}>
                        <Text style={styles.yachtDetailLabel}>PASSENGERS</Text>
                        <Text style={styles.yachtDetailValue}>{passengers}</Text>
                      </View>
                      <View style={styles.yachtDetailItem}>
                        <Text style={styles.yachtDetailLabel}>DURATION</Text>
                        <Text style={styles.yachtDetailValue}>{duration}</Text>
                      </View>
                      <View style={styles.yachtDetailItem}>
                        <Text style={styles.yachtDetailLabel}>SERVICES</Text>
                        <View style={styles.yachtServicesList}>
                          {servicesList.map((service, serviceIdx) => (
                            <Text key={serviceIdx} style={styles.yachtServicesItem}>· {service}</Text>
                          ))}
                        </View>
                      </View>
                    </View>

                    {/* Right Column - Secondary Image and Price */}
                    <View style={styles.yachtDetailsRight}>
                      {displayImages[1] && (
                        <View style={styles.yachtSecondaryImageContainer}>
                          <Image src={displayImages[1]} style={styles.yachtSecondaryImage} />
                        </View>
                      )}

                      {/* Price Below Image */}
                      <View style={styles.yachtPriceSection}>
                        <Text style={styles.yachtPriceAmount}>{formatCurrency(serviceItem.price)}</Text>
                        <Text style={styles.yachtPriceLabel}>PRICE</Text>
                      </View>
                    </View>
                  </View>

                  {/* Separator between yachts */}
                  {idx < Math.min(quote.service_items.length, 5) - 1 && (
                    <View style={styles.yachtSeparatorLine} />
                  )}
                </View>
              )
            })}

            {/* Separator before notes */}
            <View style={styles.yachtSeparatorLine} />

            {/* Notes Section */}
            {(additionalText || quote.notes) && (
              <View style={styles.yachtNotesSection}>
                <Text style={styles.yachtNotesLabel}>NOTES:</Text>
                <Text style={styles.yachtNotesText}>{additionalText || quote.notes}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.yachtFooter}>
              <Text style={styles.yachtFooterBrand}>{company.name}</Text>
              <Text style={styles.yachtFooterTagline}>{company.tagline}</Text>
              <Text style={styles.yachtFooterValidity}>
                QUOTE VALID UNTIL {formatDate(quote.expiration_date).toUpperCase()}
              </Text>
              <Text style={styles.yachtFooterContact}>
                {company.email} · {company.website}
              </Text>
            </View>
          </View>
        </Page>
      </Document>
    )
  }

  // Check if this is a car quote
  const isCarQuote = customization?.header_icon === 'car'

  // ==================== CAR LAYOUT ====================
  if (isCarQuote) {
    // Extract route info
    const pickup = customization?.route?.departure_city || 'AIRPORT'
    const dropoff = customization?.route?.arrival_city || 'HOTEL'

    return (
      <Document>
        <Page size="A4" style={styles.carPage}>
          <View style={styles.carContainer}>
            {/* Hero Section with Logo */}
            <View style={styles.carHero}>
              <Image src={CAR_HERO_IMAGE_URL} style={styles.carHeroImage} />
              <View style={styles.carLogoOverlay}>
                <Image src={LOGO_URL} style={styles.carLogo} />
              </View>
              <View style={styles.carBanner}>
                <Text style={styles.carBannerText}>CARS RENTAL PROPOSAL</Text>
              </View>
            </View>

            {/* Client Info and Date */}
            <View style={styles.carClientSection}>
              <View style={styles.carClientBox}>
                <View style={styles.carClientLabelBox}>
                  <Text style={styles.carClientLabel}>PREPARED FOR:</Text>
                </View>
                <Text style={styles.carClientName}>{quote.client_name}</Text>
                <Text style={styles.carClientEmail}>{quote.client_email}</Text>
              </View>
              <View style={styles.carDateBox}>
                <View style={styles.carDateLabelBox}>
                  <Text style={styles.carDateLabel}>EXCLUSIVE RATES</Text>
                </View>
                <Text style={styles.carDate}>{formatDate(quote.created_at)}</Text>
                <Text style={styles.carQuoteNum}>{quote.quote_number}</Text>
              </View>
            </View>

            {/* Loop through all car service items (max 5) */}
            {quote.service_items && quote.service_items.length > 0 && quote.service_items.slice(0, 5).map((serviceItem, idx) => {
              if (!serviceItem) return null

              const override = getServiceOverride(serviceItem.id || '')
              const displayImages = getDisplayImages(serviceItem.id || '', serviceItem.images || [])
              const displayName = override?.display_name || serviceItem.service_name || 'Luxury Car'
              const carModel = override?.jet_model || '' // reusing jet_model field for car model
              const displayDescription = override?.display_description || serviceItem.description || ''
              const passengers = override?.passengers || '4'
              const duration = override?.flight_time || '5 days' // reusing flight_time for duration
              // Get route info for this car (use override if exists, otherwise use global)
              const carPickup = override?.departure_city || customization?.route?.departure_city || 'AIRPORT'
              const carDropoff = override?.arrival_city || customization?.route?.arrival_city || 'HOTEL'

              return (
                <View key={serviceItem.id} style={{ marginTop: idx > 0 ? 40 : 0 }}>
                  {/* Car Name Header */}
                  <View style={styles.carNameSection}>
                    <View style={styles.carNameLeft}>
                      <Text style={styles.carNameText}>{displayName}</Text>
                      {carModel && <Text style={styles.carModelText}>{carModel}</Text>}
                    </View>
                    <Text style={styles.carPassengersText}>{passengers} Passengers</Text>
                  </View>

                  {/* Main Car Image */}
                  {displayImages[0] && (
                    <View style={styles.carImageContainer}>
                      <Image src={displayImages[0]} style={styles.carMainImage} />
                    </View>
                  )}

                  {/* Content Section: Details + Description on Left, Image + Price on Right */}
                  <View style={styles.carContentSection}>
                    {/* Left Column - Details and Description */}
                    <View style={styles.carContentLeft}>
                      <View style={styles.carDetailItem}>
                        <Text style={styles.carDetailLabel}>ROUTE</Text>
                        <Text style={styles.carDetailValue}>{carPickup} → {carDropoff}</Text>
                      </View>
                      <View style={styles.carDetailItem}>
                        <Text style={styles.carDetailLabel}>PASSENGERS</Text>
                        <Text style={styles.carDetailValue}>{passengers}</Text>
                      </View>
                      <View style={styles.carDetailItem}>
                        <Text style={styles.carDetailLabel}>DURATION</Text>
                        <Text style={styles.carDetailValue}>{duration}</Text>
                      </View>

                      {/* Description */}
                      {displayDescription && (
                        <Text style={styles.carDescText}>{displayDescription}</Text>
                      )}
                    </View>

                    {/* Right Column - Image and Price */}
                    <View style={styles.carContentRight}>
                      {displayImages[1] && (
                        <View style={styles.carSecondaryImageContainer}>
                          <Image src={displayImages[1]} style={styles.carSecondaryImage} />
                        </View>
                      )}

                      {/* Price Box */}
                      <View style={styles.carPriceBox}>
                        <Text style={styles.carPriceAmount}>{formatCurrency(serviceItem.price)}</Text>
                        <Text style={styles.carPriceLabel}>TOTAL</Text>
                      </View>
                    </View>
                  </View>

                  {/* Separator between cars */}
                  {idx < Math.min(quote.service_items.length, 5) - 1 && (
                    <View style={styles.carSeparatorLine} />
                  )}
                </View>
              )
            })}

            {/* Separator before notes */}
            <View style={styles.carSeparatorLine} />

            {/* Notes Section */}
            {quote.notes && (
              <View style={styles.carNotesSection}>
                <Text style={styles.carNotesLabel}>NOTES:</Text>
                <Text style={styles.carNotesText}>{quote.notes}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.carFooter}>
              <Text style={styles.carFooterBrand}>{company.name}</Text>
              <Text style={styles.carFooterTagline}>{company.tagline}</Text>
              <Text style={styles.carFooterValidity}>
                QUOTE VALID UNTIL {formatDate(quote.expiration_date).toUpperCase()}
              </Text>
              <Text style={styles.carFooterContact}>
                {company.email} · {company.website}
              </Text>
            </View>
          </View>
        </Page>
      </Document>
    )
  }

  // ==================== DEFAULT TICKET LAYOUT ====================
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Main Ticket Container */}
        <View style={styles.ticketContainer}>
          {/* Header Image */}
          <Image src={HEADER_IMAGE_URL} style={styles.headerImage} />

          {/* Title Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {customization?.header_title || 'Private Quotes'}
            </Text>
            {customization?.header_subtitle && (
              <Text style={styles.headerSubtitle}>{customization.header_subtitle}</Text>
            )}
          </View>

          {/* Client Info */}
          <View style={styles.clientSection}>
            <Text style={styles.clientLabel}>Prepared For</Text>
            <Text style={styles.clientName}>{quote.client_name}</Text>
            <Text style={styles.clientEmail}>{quote.client_email}</Text>
          </View>

          {/* Service Options - Ticket Style */}
          {quote.service_items.map((item) => {
            const override = getServiceOverride(item.id)
            const displayImages = getDisplayImages(item.id, item.images || [])
            const displayName = override?.display_name || item.service_name
            const displayDescription = override?.display_description || item.description
            const details = override?.details || []

            // Extract specific route details
            const dateDetail = details.find(d => d.label === 'Date')?.value || ''
            const departureCode = details.find(d => d.label === 'Departure Code')?.value || ''
            const departureDetail = details.find(d => d.label === 'Departure')?.value || ''
            const arrivalCode = details.find(d => d.label === 'Arrival Code')?.value || ''
            const arrivalDetail = details.find(d => d.label === 'Arrival')?.value || ''
            const duration = details.find(d => d.label === 'Duration')?.value || ''
            const passengers = details.find(d => d.label === 'Passengers')?.value || ''

            // Get non-route details for generic display
            const nonRouteDetails = details.filter(d =>
              !['Date', 'Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers'].includes(d.label)
            )

            const showRouteStyle = hasRouteDetails(details)

            return (
              <View key={item.id} style={styles.optionCard} wrap={false}>
                {/* First Image with Name Badge */}
                {displayImages.length > 0 && (
                  <View style={styles.imageContainer}>
                    <Image src={displayImages[0]} style={styles.serviceImage} />
                    {/* Name Badge */}
                    <View style={styles.nameBadge}>
                      <Text style={styles.nameBadgeArrow}>→</Text>
                      <Text style={styles.nameBadgeText}>{displayName}</Text>
                    </View>
                  </View>
                )}

                {/* Second Image with Passenger Badge */}
                {displayImages.length > 1 && (
                  <View style={styles.imageContainer}>
                    <Image src={displayImages[1]} style={styles.serviceImage} />
                    {/* Passenger Badge */}
                    {passengers && (
                      <View style={styles.passengerBadge}>
                        <Text style={styles.passengerText}>{passengers} Passengers</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Trip Details Section */}
                <View style={styles.tripDetails}>
                  {/* Date */}
                  {dateDetail && (
                    <Text style={styles.dateText}>{dateDetail}</Text>
                  )}

                  {/* Route Section - Ticket Style (if has departure/arrival codes) */}
                  {showRouteStyle ? (
                    <View style={styles.routeSection}>
                      {/* From */}
                      <View style={[styles.routeEndpoint, styles.routeEndpointLeft]}>
                        <Text style={styles.routeCode}>{departureCode || 'TBD'}</Text>
                        {departureDetail && (
                          <Text style={styles.routeLocation}>{departureDetail}</Text>
                        )}
                      </View>

                      {/* Duration & Arrow */}
                      <View style={styles.routeMiddle}>
                        <Text style={styles.durationText}>{duration || '---'}</Text>
                        <View style={styles.routeArrowContainer}>
                          <View style={styles.routeLine} />
                          <Text style={styles.routeArrow}>→</Text>
                          <View style={styles.routeLine} />
                        </View>
                      </View>

                      {/* To */}
                      <View style={[styles.routeEndpoint, styles.routeEndpointRight]}>
                        <Text style={styles.routeCode}>{arrivalCode || 'TBD'}</Text>
                        {arrivalDetail && (
                          <Text style={styles.routeLocation}>{arrivalDetail}</Text>
                        )}
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Fallback: Show name if no images */}
                      {displayImages.length === 0 && (
                        <Text style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 10 }}>
                          {displayName}
                        </Text>
                      )}

                      {/* Generic Details Grid */}
                      {details.length > 0 && (
                        <View style={styles.detailsGrid}>
                          {details.map((detail, idx) => (
                            <View key={idx} style={styles.detailRow}>
                              <Text style={styles.detailLabel}>{detail.label}</Text>
                              <Text style={styles.detailValue}>{detail.value}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Description */}
                      {displayDescription && (
                        <Text style={styles.description}>{displayDescription}</Text>
                      )}
                    </>
                  )}

                  {/* Non-route custom details (even if using route style) */}
                  {showRouteStyle && nonRouteDetails.length > 0 && (
                    <View style={[styles.detailsGrid, { marginBottom: 14 }]}>
                      {nonRouteDetails.map((detail, idx) => (
                        <View key={idx} style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{detail.label}</Text>
                          <Text style={styles.detailValue}>{detail.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Description (even if using route style) */}
                  {showRouteStyle && displayDescription && (
                    <Text style={[styles.description, { marginBottom: 14 }]}>{displayDescription}</Text>
                  )}

                  {/* Price */}
                  <View style={styles.priceSection}>
                    <Text style={styles.priceAmount}>{formatCurrency(item.price)}</Text>
                    <Text style={styles.priceLabel}>Total</Text>
                  </View>
                </View>
              </View>
            )
          })}

          {/* Notes */}
          {(customization?.custom_notes || quote.notes) && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>
                {customization?.custom_notes || quote.notes}
              </Text>
            </View>
          )}

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>
              {customization?.custom_terms || defaultTerms}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>CADIZ & LLUIS</Text>
            <Text style={styles.footerTagline}>Luxury Living</Text>
            <Text style={styles.footerText}>
              Quote valid until {formatDate(quote.expiration_date)}
            </Text>
            <Text style={styles.footerContact}>
              {company.email} • {company.website}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default QuotePDFBuilder
