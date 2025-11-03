import { Product } from "@/types/bundle";

// Product Images
import attachmentAssessmentCouplesImg from "@/assets/images/attachment-assessment-couples.webp";
import attachmentAssessmentSinglesImg from "@/assets/images/attachment-assessment-singles.webp";
import attachmentAssessmentParentingImg from "@/assets/images/attachment-assessment-parenting.webp";
import secureParentingCourseImg from "@/assets/images/secure-parenting-course.webp";
import attachmentBootcampCourseImg from "@/assets/images/attachment-bootcamp-course.webp";
import groupCoaching6MonthImg from "@/assets/images/group-coaching-6-month.webp";
import secureMarriageCourseImg from "@/assets/images/secure-marriage-course.webp";
import loveAvoidantManCourseImg from "@/assets/images/love-avoidant-man-course.webp";
import breakthroughCallImg from "@/assets/images/breakthrough-call.webp";

// Add-on Images  
import fourAttachmentStyleGuideImg from "@/assets/images/four-attachment-style-guide.png";
import howToTalkAvoidantManImg from "@/assets/images/how-to-talk-avoidant-man.png";
import howToBondAvoidantManImg from "@/assets/images/how-to-bond-avoidant-man.png";
import conversationCardsImg from "@/assets/images/conversation-cards.png";

// Mini Images for Cart
import attachmentAssessmentCouplesMini from "@/assets/images/mini/attachment-assessment-couples-mini.png";
import attachmentAssessmentSinglesMini from "@/assets/images/mini/attachment-assessment-singles-mini.png";
import attachmentAssessmentParentingMini from "@/assets/images/mini/attachment-assessment-parenting-mini.png";
import attachmentBootcampMini from "@/assets/images/mini/attachment-bootcamp-mini.png";
import secureMarriageMini from "@/assets/images/mini/secure-marriage-mini.png";
import secureParentingMini from "@/assets/images/mini/secure-parenting-mini.png";
import loveAvoidantManMini from "@/assets/images/mini/love-avoidant-man-mini.png";
import conversationCardsMini from "@/assets/images/mini/conversation-cards-mini.png";
import fourAttachmentStyleGuideMini from "@/assets/images/mini/four-attachment-style-guide-mini.png";
import howToBondAvoidantManMini from "@/assets/images/mini/how-to-bond-avoidant-man-mini.png";
import howToTalkAvoidantManMini from "@/assets/images/mini/how-to-talk-avoidant-man-mini.png";
import secureMarriageCheckout from "@/assets/images/mini/secure-marriage-checkout.png";
import breakthroughCallMini from "@/assets/images/mini/50.webp";

// Mini image mapping for cart items - Updated to match database SKUs
export const MINI_IMAGE_MAP: Record<string, string> = {
  "COURSE_AVOIDANT_MAN": loveAvoidantManMini,
  "COURSE_SECURE_MARRIAGE": secureMarriageMini,
  "WAITLIST_SECURE_PARENTING": secureParentingMini,
  "COURSE_ATTACHMENT_BOOTCAMP": attachmentBootcampMini,
  "ASSESSMENT_SINGLES": attachmentAssessmentSinglesMini,
  "ASSESSMENT_COUPLES": attachmentAssessmentCouplesMini,
  "ASSESSMENT_PARENTING": attachmentAssessmentParentingMini,
  "GROUP_COACHING_6_MONTH": groupCoaching6MonthImg,
  "GUIDE_4_STYLES": fourAttachmentStyleGuideMini,
  "MINI_TALK_AVOIDANT": howToTalkAvoidantManMini,
  "GUIDE_BOND_AVOIDANT": howToBondAvoidantManMini,
  "CONVERSATION_CARDS": conversationCardsMini,
  "breakthrough-call": breakthroughCallMini
};

// Product data - Reordered to match requested flow
export const sampleProducts: readonly Product[] = [
  // Courses & Programs - Reordered as requested

  {
    sku: "ASSESSMENT_PARENTING",
    title: "Attachment Assessment - Parenting",
    link: "#",
    type: "assessment",
    summary: "An 80-minute assessment with attachment coach Lisa Chan and 30-minute follow up strategy session with a relationship strategist to identify parent-child attachment patterns and map your path to secure, confident parenting.",
    msrp: 1197,
    imageUrl: attachmentAssessmentParentingImg,
    countsTowardThreshold: true,
    giftEligible: false,
    sortOrder: 1
  },
  {
    sku: "WAITLIST_SECURE_PARENTING",
    title: "Secure Parenting: From Chaos to Calm",
    link: "#",
    type: "course",
    summary: "The ultimate program bundle from attachment expert Adam Lane Smith and parenting expert Lisa Chan, combining attachment science with hands-on regulation skills to raise secure, emotionally healthy kids.",
    msrp: 0,
    imageUrl: secureParentingCourseImg,
    countsTowardThreshold: false,
    giftEligible: false,
    sortOrder: 2
  },
  {
    sku: "COURSE_AVOIDANT_MAN",
    title: "How to Love an Avoidant Man",
    link:"https://adamlanesmith.com/product/how-to-love-an-avoidant-man/",
    type: "course",
    summary: "Discover the attachment-driven approach that helps avoidant men fall deeply in love. Dive deep into avoidant behaviors and how to reverse them through bonding and connection.",
    msrp: 497,
    imageUrl: loveAvoidantManCourseImg,
    countsTowardThreshold: true,
    giftEligible: false,
    sortOrder: 10
  }, {
    sku: "COURSE_SECURE_MARRIAGE",
    title: "How to Build a Secure Marriage",
    link:"https://adamlanesmith.com/product/how-to-build-a-secure-marriage/",
    type: "course",
    summary: "Learn how to resolve recurring conflicts, rebuild trust & intimacy, activate deep neurochemical bonding and build a happy, fulfilling marriage that lasts a lifetime.",
    msrp: 847,
    imageUrl: secureMarriageCourseImg,
    countsTowardThreshold: true,
    giftEligible: false,
    sortOrder: 30
  }, {
    sku: "COURSE_ATTACHMENT_BOOTCAMP",
    title: "The Attachment Bootcamp",
    link:"https://adamlanesmith.com/product/the-attachment-bootcamp/",
    type: "course",
    summary: "The complete system to rebuilding your attachment style and breaking free from restrictive relationships and lifelong insecurities.",
    msrp: 497,
    imageUrl: attachmentBootcampCourseImg,
    countsTowardThreshold: true,
    giftEligible: false,
    sortOrder: 20
  }, {
    sku: "GROUP_COACHING_6_MONTH",
    title: "Group Coaching - 6 Month Membership",
    link: "https://adamlanesmith.com/group-coaching/",
    type: "group_coaching",
    summary: "Featuring 2 live Adam-led exclusive masterclasses per week and a thriving global community, this program offers extensive support & transformation.",
    msrp: 1427,
    imageUrl: groupCoaching6MonthImg,
    countsTowardThreshold: true,
    giftEligible: false,
    sortOrder: 40
  }, {
    sku: "ASSESSMENT_SINGLES",
    title: "Attachment Assessment - Singles Only",
    link: "#",
    type: "assessment",
    summary: "An 80-min private Coach-led Assessment and 30-min Relationship Strategy call to identify your attachment style & insecure patterns, and plan a breakthrough.",
    msrp: 1995,
    imageUrl: attachmentAssessmentSinglesImg,
    countsTowardThreshold: true,
    giftEligible: false,
    sortOrder: 50
  }, {
    sku: "ASSESSMENT_COUPLES",
    title: "Attachment Assessment - Couples",
    link: "#",
    type: "assessment",
    summary: "Two 80-min private Coach-led Assessments and 30-min Relationship Strategy calls to help couples transform their attachment together.",
    msrp: 3990,
    imageUrl: attachmentAssessmentCouplesImg,
    countsTowardThreshold: true,
    giftEligible: false,
    sortOrder: 60
  }, 
  // Downloadables & Add-ons (gift-eligible)
  {
    sku: "CONVERSATION_CARDS",
    title: "30 Conversation Cards",
    link: "#",
    type: "addon",
    summary: "Expert-crafted, detailed conversation prompts to practice curiosity, safety, and shared meaning.",
    msrp: 49,
    imageUrl: conversationCardsImg,
    countsTowardThreshold: false,
    giftEligible: true,
    sortOrder: 100
  }, {
    sku: "GUIDE_4_STYLES",
    title: "Four Attachment Style Guides",
    link: "#",
    type: "addon",
    summary: "The Ultimate Attachment reference bundle – featuring 4 in-depth guides on each of the attachment styles.",
    msrp: 196,
    imageUrl: fourAttachmentStyleGuideImg,
    countsTowardThreshold: false,
    giftEligible: true,
    sortOrder: 90
  }, {
    sku: "GUIDE_BOND_AVOIDANT",
    title: "How To Bond With An Avoidant Man",
    link: "#",
    type: "addon",
    summary: "A detailed guide and step-by-step bonding framework for bonding with avoidant partners.",
    msrp: 49,
    imageUrl: howToBondAvoidantManImg,
    countsTowardThreshold: false,
    giftEligible: true,
    sortOrder: 70
  }, {
    sku: "MINI_TALK_AVOIDANT",
    title: "How To Talk To An Avoidant Man",
    link: "#",
    type: "addon",
    summary: "This mini course includes scripts and setups to connect with an avoidant without triggering withdrawal.",
    msrp: 49,
    imageUrl: howToTalkAvoidantManImg,
    countsTowardThreshold: false,
    giftEligible: true,
    sortOrder: 80
  }, {
    sku: "breakthrough-call",
    title: "50-min Private Consultation",
    link: "#",
    type: "consultation",
    summary: "A private one-on-one consultation to address your specific relationship challenges and create a personalized action plan.",
    msrp: 800,
    imageUrl: breakthroughCallImg,
    countsTowardThreshold: true,
    giftEligible: false,
    sortOrder: 70
  },
];