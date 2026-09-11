import type { ResumeData } from "@/components/admin/types";

// Default resume content, mirroring Dicky's current CV. Used as a fallback when
// no `settings/resume` document exists yet, and as the seed for the admin editor.
export const defaultResume: ResumeData = {
  title: "Technical Business Analyst",
  name: "Chu Pak Yin (Dicky)",
  email: "chu.dicky@outlook.com",
  phone: "+852 9780 5964",
  portfolioUrl: "https://dickyportfolio-cpy.vercel.app",
  linkedinUrl: "https://www.linkedin.com/in/dicky-chu",
  summary:
    "Business Analyst with 4+ years of experience delivering digital and AI products across the Software Development Life Cycle, specializing in Agile delivery, production operations, and stakeholder management. Experienced in requirements gathering and analysis, Change Request management, man-day and cost estimation, backlog management, offshore development coordination, SAT/UAT, and defect triage.",
  experience: [
    {
      company: "IBM Consulting",
      role: "Digital Operation Analyst, IBM iX",
      dateRange: "Dec 2025 - Now",
      bullets: [
        "Supported delivery of AI-powered and phygital customer experiences, including an AI horse-selection station and digital broadcast experience integrating live race information, such as odds and Generative AI content for racecourse visitors.",
        "Served as the primary client-facing contact, translating business needs into actionable requirements while leading offshore development teams to drive implementation and delivery.",
        "Conducted SA briefings and collaborated with UAT/SAT teams throughout the testing cycle; led SAT/UAT coordination and defect triage, analysing reproduction conditions.",
        "Investigated complex production issues spanning app logic, real-time events, data, and network/environment configurations; conducted root cause analysis and prepared RCA reports.",
        "Coordinated release implementation across SAT/PROD environments, working with client IT and technical teams to support production deployment and perform post-release production testing and data health-checking.",
        "Prepared PDLC documentation and System Requirement Specifications to maintain requirements and delivery records, and conducted client-side knowledge-transfer sessions and product walkthroughs to support user adoption.",
      ],
    },
    {
      company: "ESSAA Limited",
      role: "PM/BA Specialist",
      dateRange: "Jun 2022 - Oct 2025",
      bullets: [
        "Led the end-to-end delivery of an AI-powered Marketing SaaS platform, overseeing product discovery, technical scoping, sprint management, and preparing and conducting UAT and regression testing.",
        "Planned and executed a pilot onboarding workshop for 50+ external stakeholders across South America.",
        "Represented the company at international summits (Hong Kong, Taiwan, Vancouver) to pitch solutions and engage clients.",
        "Developed and managed social media strategies and marketing assets, representing the product at industry events to translate technical value into clear business impact, driving both awareness and engagement.",
      ],
    },
  ],
  education: [
    {
      school: "Centennial College",
      program: "Post Graduate Diploma - Interactive Media Management",
      dateRange: "Dec 2022 - Dec 2023",
    },
    {
      school: "The Hong Kong Polytechnic University",
      program: "BA (Hon) - Fashion & Textiles (Technology)",
      dateRange: "Sep 2018 - Jul 2022",
    },
  ],
  certifications: [
    {
      name: "AWS Certified AI Practitioner",
      issuer: "Amazon Web Services (AWS)",
      dateRange: "Dec 2024 - Dec 2027",
    },
  ],
  skills: [
    {
      label: "Generative AI / AI Platforms",
      items:
        "GenAI inference, AI APIs, AI platform architecture, model deployment concepts",
    },
    {
      label: "Cloud / Infrastructure",
      items:
        "Azure Kubernetes Service (AKS), Azure Blob Storage, cloud deployment concepts",
    },
    {
      label: "Data / Analytics",
      items: "SQL, Unity Analytics, funnel and traffic analytics",
    },
    {
      label: "Delivery",
      items:
        "Jira, Monday, Agile, SAT/UAT/LCT, defect triage, PDLC documentation, Change Request management",
    },
    {
      label: "Design",
      items:
        "Figma, UI/UX design, design systems, prototyping, responsive design",
    },
    {
      label: "Integration / Event-driven Systems",
      items: "MQTT real-time event flows, APIs, SDK integration",
    },
  ],
};
