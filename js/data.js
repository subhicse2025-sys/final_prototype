/**
 * data.js – In-memory sample data & persistence layer
 * Aram Office – E-Governance Document Processing & Retrieval System
 *
 * Simulates the Java backend's:
 *   - GovernmentDocument / CircularDocument / ApplicationForm objects
 *   - DocumentVersion composition
 *   - HashMap<String,Document> document store
 *   - ArrayList<DocumentVersion> version history per document
 */

"use strict";

// ── Departments & Categories ──────────────────────────────────────────
const DEPARTMENTS = [
  "Revenue Department",
  "Health Department",
  "Education Department",
  "Public Works Department"
];

const CATEGORIES = {
  "Revenue Department":       ["Income Certificate", "Pension", "Tax and Revenue"],
  "Health Department":        ["Public Health"],
  "Education Department":     ["Education Services"],
  "Public Works Department":  ["Public Works"]
};

const ALL_CATEGORIES = [
  "Income Certificate", "Pension", "Tax and Revenue",
  "Public Health", "Education Services", "Public Works"
];

const IMPORTANCE_LEVELS = ["High", "Medium", "Low"];
const DOC_TYPES = [
  "Circular",
  "ApplicationForm",
  "Certificate",
  "GovernmentOrder",
  "ServiceInstruction",
  "CitizenCharter",
  "PublicNotice"
];

// ── Initial Sample Documents (50 docs) ───────────────────────────────
const INITIAL_DOCUMENTS = [
  // ── Revenue Department – Income Certificate ──
  {
    id:"DOC101", title:"Income Certificate Application Form",
    type:"ApplicationForm", department:"Revenue Department", category:"Income Certificate",
    importance:"High", keywords:["income","certificate","application","form","family income","revenue"],
    content:"Standard application form for obtaining income certificate from the Revenue Department. Applicants must provide family income details, proof of residence, and ration card.",
    versions:[
      { version:1, date:"2023-01-15", status:"Outdated", notes:"Initial release of income certificate application." },
      { version:2, date:"2024-03-10", status:"Current",  notes:"Updated with Aadhaar verification requirement and new fee structure." }
    ]
  },
  {
    id:"DOC102", title:"Income Certificate Circular 2024",
    type:"Circular", department:"Revenue Department", category:"Income Certificate",
    importance:"High", keywords:["income","certificate","circular","2024","guidelines","revenue"],
    content:"Circular issued by the Revenue Department outlining updated procedures for issuing income certificates. All tehsildars must follow revised income slabs effective April 2024.",
    versions:[
      { version:1, date:"2024-04-01", status:"Current",  notes:"New income slabs and digital verification process." }
    ]
  },
  {
    id:"DOC103", title:"Income Certificate Fee Structure",
    type:"Circular", department:"Revenue Department", category:"Income Certificate",
    importance:"Medium", keywords:["income","certificate","fee","charges","stamp duty"],
    content:"Defines fee structure for issuing income certificates at Taluk and District levels including stamp duty, processing fee, and courier charges.",
    versions:[
      { version:1, date:"2023-06-01", status:"Outdated", notes:"Original fee schedule." },
      { version:2, date:"2024-06-01", status:"Current",  notes:"Revised fees for FY 2024-25." }
    ]
  },
  {
    id:"DOC104", title:"Income Certificate Validity Guidelines",
    type:"Circular", department:"Revenue Department", category:"Income Certificate",
    importance:"Medium", keywords:["income","certificate","validity","renewal","expiry"],
    content:"Explains the validity period of income certificates for various purposes such as scholarship, housing, and government schemes. Standard validity is one year from date of issue.",
    versions:[
      { version:1, date:"2023-09-15", status:"Current",  notes:"Standard guidelines release." }
    ]
  },
  // ── Revenue Department – Pension ──
  {
    id:"DOC105", title:"Old Age Pension Application Form",
    type:"ApplicationForm", department:"Revenue Department", category:"Pension",
    importance:"High", keywords:["pension","old age","senior citizen","application","social welfare"],
    content:"Application form for senior citizens above 60 years to apply for old age pension under the Chief Minister's scheme. Requires age proof, bank account details, and Aadhaar.",
    versions:[
      { version:1, date:"2022-07-01", status:"Outdated", notes:"Initial version." },
      { version:2, date:"2023-07-01", status:"Outdated", notes:"Added bank account mandatory field." },
      { version:3, date:"2024-07-01", status:"Current",  notes:"Included DBT mandate and e-KYC verification." }
    ]
  },
  {
    id:"DOC106", title:"Widow Pension Scheme Guidelines",
    type:"Circular", department:"Revenue Department", category:"Pension",
    importance:"High", keywords:["pension","widow","scheme","guidelines","social security","women"],
    content:"Circular detailing eligibility, application process, and disbursement schedule for widow pension scheme under the state social welfare program.",
    versions:[
      { version:1, date:"2023-03-08", status:"Outdated", notes:"Initial guidelines." },
      { version:2, date:"2024-03-08", status:"Current",  notes:"Enhanced monthly amount and beneficiary addition." }
    ]
  },
  {
    id:"DOC107", title:"Pension Disbursement Schedule 2024",
    type:"Circular", department:"Revenue Department", category:"Pension",
    importance:"Medium", keywords:["pension","disbursement","schedule","payment","date","2024"],
    content:"Monthly disbursement schedule for all pension categories including old age, widow, and disability pension for FY 2024-25.",
    versions:[
      { version:1, date:"2024-04-05", status:"Current",  notes:"Published for FY 2024-25." }
    ]
  },
  {
    id:"DOC108", title:"Disability Pension Application",
    type:"ApplicationForm", department:"Revenue Department", category:"Pension",
    importance:"High", keywords:["disability","pension","application","specially abled","certificate"],
    content:"Application form for persons with disabilities (40% and above) to apply for monthly disability pension. Medical certificate from government hospital required.",
    versions:[
      { version:1, date:"2022-11-01", status:"Outdated", notes:"Original form." },
      { version:2, date:"2024-01-15", status:"Current",  notes:"Updated disability percentage criteria." }
    ]
  },
  // ── Revenue Department – Tax and Revenue ──
  {
    id:"DOC109", title:"Property Tax Assessment Circular",
    type:"Circular", department:"Revenue Department", category:"Tax and Revenue",
    importance:"High", keywords:["property","tax","assessment","circular","land revenue","demand"],
    content:"Annual circular for property tax assessment procedures. All revenue inspectors must complete zone-wise assessment by 31 May each year.",
    versions:[
      { version:1, date:"2023-04-01", status:"Outdated", notes:"FY 2023-24 assessment." },
      { version:2, date:"2024-04-01", status:"Current",  notes:"FY 2024-25 assessment with revised zone rates." }
    ]
  },
  {
    id:"DOC110", title:"Property Tax Payment Procedure",
    type:"Circular", department:"Revenue Department", category:"Tax and Revenue",
    importance:"Medium", keywords:["property","tax","payment","online","portal","challan"],
    content:"Step-by-step procedure for paying property tax online through the Aram Office e-payment portal, including challan generation and receipt download.",
    versions:[
      { version:1, date:"2023-10-01", status:"Current",  notes:"Online payment integration released." }
    ]
  },
  {
    id:"DOC111", title:"Land Revenue Arrears Notice Format",
    type:"Circular", department:"Revenue Department", category:"Tax and Revenue",
    importance:"High", keywords:["land","revenue","arrears","notice","demand","recovery"],
    content:"Standard format for issuing land revenue arrears notices to defaulters. Must be signed by the Tahsildar and issued via registered post.",
    versions:[
      { version:1, date:"2023-01-01", status:"Outdated", notes:"Original notice format." },
      { version:2, date:"2024-02-01", status:"Current",  notes:"Updated with digital signature mandate." }
    ]
  },
  {
    id:"DOC112", title:"Tax Exemption Application Form",
    type:"ApplicationForm", department:"Revenue Department", category:"Tax and Revenue",
    importance:"Medium", keywords:["tax","exemption","application","agricultural land","charitable"],
    content:"Application form for claiming tax exemption on agricultural land and charitable institutions registered under the Trust Act.",
    versions:[
      { version:1, date:"2023-05-01", status:"Current",  notes:"Initial release." }
    ]
  },
  {
    id:"DOC113", title:"Revenue Recovery Act Circular",
    type:"Circular", department:"Revenue Department", category:"Tax and Revenue",
    importance:"High", keywords:["revenue","recovery","act","circular","enforcement","tax"],
    content:"Procedural circular for initiation of revenue recovery proceedings under the Tamil Nadu Revenue Recovery Act for persistent defaulters.",
    versions:[
      { version:1, date:"2022-09-01", status:"Outdated", notes:"Original." },
      { version:2, date:"2024-09-01", status:"Current",  notes:"Revised threshold amounts and appeal procedures." }
    ]
  },
  // ── Health Department – Public Health ──
  {
    id:"DOC201", title:"Health Awareness Circular – Dengue Prevention",
    type:"Circular", department:"Health Department", category:"Public Health",
    importance:"High", keywords:["health","dengue","prevention","awareness","mosquito","vector control"],
    content:"Seasonal circular for dengue prevention activities. All PHC staff must conduct weekly fogging and distribute awareness pamphlets in identified zones.",
    versions:[
      { version:1, date:"2023-06-01", status:"Outdated", notes:"Pre-monsoon circular." },
      { version:2, date:"2024-06-01", status:"Current",  notes:"Updated with rapid test kit protocol." }
    ]
  },
  {
    id:"DOC202", title:"COVID-19 Safety Protocol Update",
    type:"Circular", department:"Health Department", category:"Public Health",
    importance:"High", keywords:["covid","safety","protocol","health","quarantine","mask","vaccination"],
    content:"Updated safety protocols for government offices regarding COVID-19 precautions including mask policy, sanitisation, and isolation procedures.",
    versions:[
      { version:1, date:"2021-04-01", status:"Outdated", notes:"First protocol." },
      { version:2, date:"2022-01-01", status:"Outdated", notes:"Omicron update." },
      { version:3, date:"2023-05-01", status:"Current",  notes:"Post-emergency relaxed guidelines." }
    ]
  },
  {
    id:"DOC203", title:"Maternal Health Services Application",
    type:"ApplicationForm", department:"Health Department", category:"Public Health",
    importance:"High", keywords:["maternal","health","pregnancy","antenatal","postnatal","mother","application"],
    content:"Enrollment form for pregnant women to register for Aram Office maternal health services including free antenatal check-ups and nutrition supplements.",
    versions:[
      { version:1, date:"2023-02-15", status:"Outdated", notes:"Original form." },
      { version:2, date:"2024-02-15", status:"Current",  notes:"Added nutrition benefit and vaccination schedule." }
    ]
  },
  {
    id:"DOC204", title:"Vaccination Drive Schedule 2024",
    type:"Circular", department:"Health Department", category:"Public Health",
    importance:"High", keywords:["vaccination","immunisation","schedule","drive","health","children"],
    content:"Schedule for district-wide vaccination drive for children under 5 years covering polio, measles, and hepatitis B. Booth locations included.",
    versions:[
      { version:1, date:"2024-01-10", status:"Current",  notes:"2024 annual drive schedule." }
    ]
  },
  {
    id:"DOC205", title:"Public Health Inspection Guidelines",
    type:"Circular", department:"Health Department", category:"Public Health",
    importance:"Medium", keywords:["public health","inspection","sanitation","food safety","hygiene"],
    content:"Guidelines for health inspectors conducting food safety and sanitation inspections at markets, restaurants, and public places in the Aram Office jurisdiction.",
    versions:[
      { version:1, date:"2023-08-01", status:"Outdated", notes:"Original guidelines." },
      { version:2, date:"2024-08-01", status:"Current",  notes:"Added food adulteration test procedures." }
    ]
  },
  {
    id:"DOC206", title:"Birth Registration Procedure Circular",
    type:"Circular", department:"Health Department", category:"Public Health",
    importance:"Medium", keywords:["birth","registration","certificate","procedure","civil registration"],
    content:"Updated procedure for online birth registration at Aram Office including hospital duty, parent submission, and certificate issuance within 21 days.",
    versions:[
      { version:1, date:"2023-03-01", status:"Outdated", notes:"Manual process." },
      { version:2, date:"2024-03-01", status:"Current",  notes:"Fully digital process with e-certificate." }
    ]
  },
  {
    id:"DOC207", title:"Death Certificate Application Form",
    type:"ApplicationForm", department:"Health Department", category:"Public Health",
    importance:"High", keywords:["death","certificate","application","civil registration","form"],
    content:"Application form for obtaining a certified death certificate from the Health Department. Required for legal, insurance, and estate proceedings.",
    versions:[
      { version:1, date:"2022-06-01", status:"Outdated", notes:"Paper form." },
      { version:2, date:"2024-06-01", status:"Current",  notes:"Digital submission enabled." }
    ]
  },
  {
    id:"DOC208", title:"Mental Health Awareness Circular",
    type:"Circular", department:"Health Department", category:"Public Health",
    importance:"Medium", keywords:["mental health","awareness","counselling","psychological","wellness"],
    content:"Circular promoting mental health awareness programs across schools and workplaces in the district. PHC counsellors to conduct monthly sessions.",
    versions:[
      { version:1, date:"2024-10-01", status:"Current",  notes:"New initiative launch." }
    ]
  },
  {
    id:"DOC209", title:"Health Camp Notification Form",
    type:"ApplicationForm", department:"Health Department", category:"Public Health",
    importance:"Low", keywords:["health camp","notification","medical camp","free check-up"],
    content:"Form for NGOs and approved organisations to apply for permission to conduct free health camps in Aram Office jurisdiction.",
    versions:[
      { version:1, date:"2023-07-01", status:"Current",  notes:"Initial release." }
    ]
  },
  // ── Education Department – Education Services ──
  {
    id:"DOC301", title:"Scholarship Application Guidelines",
    type:"Circular", department:"Education Department", category:"Education Services",
    importance:"High", keywords:["scholarship","guidelines","student","education","merit","financial aid"],
    content:"Comprehensive guidelines for applying to state and central scholarship schemes for meritorious students from economically weaker sections.",
    versions:[
      { version:1, date:"2022-08-01", status:"Outdated", notes:"Original." },
      { version:2, date:"2023-08-01", status:"Outdated", notes:"Updated eligibility." },
      { version:3, date:"2024-08-01", status:"Current",  notes:"Increased scholarship amount and online process." }
    ]
  },
  {
    id:"DOC302", title:"Post-Matric Scholarship Application Form",
    type:"ApplicationForm", department:"Education Department", category:"Education Services",
    importance:"High", keywords:["scholarship","post-matric","application","form","college","higher education"],
    content:"Application form for SC/ST and OBC students to apply for post-matric scholarship for college and professional courses.",
    versions:[
      { version:1, date:"2023-09-01", status:"Outdated", notes:"Paper form." },
      { version:2, date:"2024-09-01", status:"Current",  notes:"Online form with income certificate upload." }
    ]
  },
  {
    id:"DOC303", title:"School Transfer Certificate Circular",
    type:"Circular", department:"Education Department", category:"Education Services",
    importance:"Medium", keywords:["transfer","certificate","school","TC","migration","student"],
    content:"Circular defining the procedure for issuing transfer certificates (TC) when a student transfers between schools within or outside the district.",
    versions:[
      { version:1, date:"2023-04-01", status:"Current",  notes:"Standardised TC format." }
    ]
  },
  {
    id:"DOC304", title:"Mid-Day Meal Scheme Guidelines",
    type:"Circular", department:"Education Department", category:"Education Services",
    importance:"High", keywords:["mid-day meal","nutrition","school","guidelines","meal scheme","children"],
    content:"Operational guidelines for the Mid-Day Meal Scheme covering menu planning, supplier empanelment, hygiene, and nutritional standards.",
    versions:[
      { version:1, date:"2022-06-01", status:"Outdated", notes:"Original guidelines." },
      { version:2, date:"2023-06-01", status:"Outdated", notes:"Protein supplement added." },
      { version:3, date:"2024-06-01", status:"Current",  notes:"Revised menu with regional preferences." }
    ]
  },
  {
    id:"DOC305", title:"Teacher Recruitment Notification",
    type:"Circular", department:"Education Department", category:"Education Services",
    importance:"High", keywords:["teacher","recruitment","notification","vacancy","examination","TET"],
    content:"Notification for recruitment of primary and secondary school teachers under the Aram Office Education Department. Includes TET eligibility and exam schedule.",
    versions:[
      { version:1, date:"2024-05-01", status:"Current",  notes:"2024 recruitment cycle." }
    ]
  },
  {
    id:"DOC306", title:"Free Uniform Scheme Application",
    type:"ApplicationForm", department:"Education Department", category:"Education Services",
    importance:"Medium", keywords:["uniform","scheme","school","free","application","student"],
    content:"Application form for enrolling school students for free uniform scheme provided by the state government under the Education Welfare Programme.",
    versions:[
      { version:1, date:"2023-06-01", status:"Outdated", notes:"Original." },
      { version:2, date:"2024-06-01", status:"Current",  notes:"Size chart updated." }
    ]
  },
  {
    id:"DOC307", title:"Annual Examination Schedule Circular",
    type:"Circular", department:"Education Department", category:"Education Services",
    importance:"High", keywords:["examination","annual","schedule","timetable","board exam","school"],
    content:"Annual examination timetable and schedule circular for classes 1 to 12 under the Aram Office Education Department for the academic year 2024-25.",
    versions:[
      { version:1, date:"2024-09-01", status:"Current",  notes:"AY 2024-25 schedule." }
    ]
  },
  {
    id:"DOC308", title:"Special Education Scheme Guidelines",
    type:"Circular", department:"Education Department", category:"Education Services",
    importance:"Medium", keywords:["special education","disability","inclusive","school","guidelines","differently abled"],
    content:"Guidelines for inclusive education of children with disabilities including resource room setup, assistive technology, and trained resource teacher deployment.",
    versions:[
      { version:1, date:"2023-10-01", status:"Current",  notes:"Inclusive education framework." }
    ]
  },
  {
    id:"DOC309", title:"Library Book Grant Scheme",
    type:"Circular", department:"Education Department", category:"Education Services",
    importance:"Low", keywords:["library","book grant","school","reading","education","scheme"],
    content:"Guidelines for allocating library book grants to government schools based on student enrollment, with preference for STEM and vernacular titles.",
    versions:[
      { version:1, date:"2023-12-01", status:"Current",  notes:"Annual book grant allocation." }
    ]
  },
  {
    id:"DOC310", title:"Higher Education Loan Application Form",
    type:"ApplicationForm", department:"Education Department", category:"Education Services",
    importance:"High", keywords:["higher education","loan","application","college","scholarship","financial"],
    content:"Application form for education loan assistance for students pursuing professional courses (Engineering, Medicine, Law) through Aram Office scholarship fund.",
    versions:[
      { version:1, date:"2022-11-01", status:"Outdated", notes:"Original." },
      { version:2, date:"2024-11-01", status:"Current",  notes:"Loan limit enhanced to ₹2 lakh." }
    ]
  },
  // ── Public Works Department – Public Works ──
  {
    id:"DOC401", title:"Road Maintenance Work Order",
    type:"Circular", department:"Public Works Department", category:"Public Works",
    importance:"High", keywords:["road","maintenance","work order","repair","highway","PWD"],
    content:"Standard format for issuing road maintenance work orders for district roads. Includes technical specifications, contractor eligibility, and inspection checklist.",
    versions:[
      { version:1, date:"2022-05-01", status:"Outdated", notes:"Original work order format." },
      { version:2, date:"2023-05-01", status:"Outdated", notes:"Material quality standards updated." },
      { version:3, date:"2024-05-01", status:"Current",  notes:"GST-compliant bill format included." }
    ]
  },
  {
    id:"DOC402", title:"Road Construction Tender Guidelines",
    type:"Circular", department:"Public Works Department", category:"Public Works",
    importance:"High", keywords:["road","construction","tender","guidelines","contractor","bid","public works"],
    content:"Guidelines for inviting tenders for new road construction projects. Specifies eligibility criteria, bid security, EMD, and performance guarantee requirements.",
    versions:[
      { version:1, date:"2023-03-01", status:"Outdated", notes:"Original tender guidelines." },
      { version:2, date:"2024-03-01", status:"Current",  notes:"e-Tender portal mandatory." }
    ]
  },
  {
    id:"DOC403", title:"Building Plan Approval Application",
    type:"ApplicationForm", department:"Public Works Department", category:"Public Works",
    importance:"High", keywords:["building","plan","approval","application","construction permit","setback"],
    content:"Application form for obtaining building plan approval from the Aram Office Planning Authority. Includes site plan, floor plan, and structural drawing requirements.",
    versions:[
      { version:1, date:"2021-09-01", status:"Outdated", notes:"Original." },
      { version:2, date:"2022-09-01", status:"Outdated", notes:"FAR norms updated." },
      { version:3, date:"2024-09-01", status:"Current",  notes:"Green building norms and solar mandate added." }
    ]
  },
  {
    id:"DOC404", title:"Drinking Water Supply Scheme Circular",
    type:"Circular", department:"Public Works Department", category:"Public Works",
    importance:"High", keywords:["drinking water","water supply","scheme","circular","pipe","village"],
    content:"Circular for implementation of rural drinking water supply schemes under JJMY. Village-level committees to identify beneficiaries and monitor pipe connections.",
    versions:[
      { version:1, date:"2023-07-01", status:"Outdated", notes:"Initial circular." },
      { version:2, date:"2024-07-01", status:"Current",  notes:"HAR GHAR JAL target updated." }
    ]
  },
  {
    id:"DOC405", title:"Street Light Maintenance Application",
    type:"ApplicationForm", department:"Public Works Department", category:"Public Works",
    importance:"Low", keywords:["street light","maintenance","complaint","repair","application"],
    content:"Form for village panchayats to submit street light maintenance complaints and request repair services from the Public Works Department.",
    versions:[
      { version:1, date:"2023-02-01", status:"Current",  notes:"Standard maintenance form." }
    ]
  },
  {
    id:"DOC406", title:"Bridge Inspection Report Format",
    type:"Circular", department:"Public Works Department", category:"Public Works",
    importance:"High", keywords:["bridge","inspection","report","structural","safety","PWD"],
    content:"Standard format and procedure for biannual bridge inspection by PWD engineers to assess structural integrity and maintenance needs.",
    versions:[
      { version:1, date:"2022-04-01", status:"Outdated", notes:"Original format." },
      { version:2, date:"2024-04-01", status:"Current",  notes:"Rating scale and drone inspection included." }
    ]
  },
  {
    id:"DOC407", title:"Rainwater Harvesting Guidelines",
    type:"Circular", department:"Public Works Department", category:"Public Works",
    importance:"Medium", keywords:["rainwater","harvesting","guidelines","water conservation","borewell","recharge"],
    content:"Mandatory guidelines for rainwater harvesting structures in new constructions above 2400 sq ft within Aram Office limits.",
    versions:[
      { version:1, date:"2023-06-01", status:"Current",  notes:"Initial mandate." }
    ]
  },
  {
    id:"DOC408", title:"Public Building Renovation Work Order",
    type:"Circular", department:"Public Works Department", category:"Public Works",
    importance:"Medium", keywords:["building","renovation","work order","government","public works","repair"],
    content:"Procedure and format for issuing renovation work orders for government buildings including schools, hospitals, and panchayat offices.",
    versions:[
      { version:1, date:"2023-01-01", status:"Outdated", notes:"Original format." },
      { version:2, date:"2024-01-01", status:"Current",  notes:"Rate schedule updated for 2024." }
    ]
  },
  {
    id:"DOC409", title:"Sewage System Upgrade Application",
    type:"ApplicationForm", department:"Public Works Department", category:"Public Works",
    importance:"Medium", keywords:["sewage","drainage","upgrade","application","sanitation","public works"],
    content:"Application form for local bodies to request sewage system upgrade or drainage improvement works through the Aram Office Public Works Department.",
    versions:[
      { version:1, date:"2023-11-01", status:"Current",  notes:"Initial release." }
    ]
  },
  {
    id:"DOC410", title:"Solar Panel Installation Guidelines",
    type:"Circular", department:"Public Works Department", category:"Public Works",
    importance:"Medium", keywords:["solar","panel","installation","renewable energy","guidelines","rooftop"],
    content:"Guidelines for rooftop solar panel installation on government buildings under the MNRE scheme. Includes technical specs, vendor empanelment, and subsidy claim procedure.",
    versions:[
      { version:1, date:"2024-02-01", status:"Current",  notes:"New scheme circular." }
    ]
  },
  // Additional docs to reach 50
  {
    id:"DOC411", title:"Flood Relief Application Form",
    type:"ApplicationForm", department:"Revenue Department", category:"Tax and Revenue",
    importance:"High", keywords:["flood","relief","application","disaster","compensation","revenue"],
    content:"Application form for flood-affected families to claim compensation and relief from the Revenue Department under the State Disaster Relief Fund.",
    versions:[
      { version:1, date:"2023-11-01", status:"Outdated", notes:"Original." },
      { version:2, date:"2024-11-01", status:"Current",  notes:"Increased compensation slabs." }
    ]
  },
  {
    id:"DOC412", title:"Agricultural Land Conversion Application",
    type:"ApplicationForm", department:"Revenue Department", category:"Tax and Revenue",
    importance:"High", keywords:["agricultural","land","conversion","application","non-agricultural","revenue"],
    content:"Application form for converting agricultural land to non-agricultural use. Requires land documents, NOC from agriculture department, and collector's approval.",
    versions:[
      { version:1, date:"2022-03-01", status:"Outdated", notes:"Original." },
      { version:2, date:"2024-03-01", status:"Current",  notes:"Environmental clearance added." }
    ]
  },
  {
    id:"DOC413", title:"Encumbrance Certificate Application",
    type:"ApplicationForm", department:"Revenue Department", category:"Income Certificate",
    importance:"Medium", keywords:["encumbrance","certificate","property","application","land records"],
    content:"Application form to obtain an encumbrance certificate from the Revenue Department showing property transaction history for the last 30 years.",
    versions:[
      { version:1, date:"2023-04-01", status:"Outdated", notes:"Original." },
      { version:2, date:"2024-04-01", status:"Current",  notes:"Online EC available via TNREGINET." }
    ]
  },
  {
    id:"DOC414", title:"Nativity Certificate Application",
    type:"ApplicationForm", department:"Revenue Department", category:"Income Certificate",
    importance:"Medium", keywords:["nativity","certificate","domicile","application","residence","revenue"],
    content:"Application form for obtaining a nativity/domicile certificate for Tamil Nadu residents from the Revenue Department. Requires proof of residence for 3+ years.",
    versions:[
      { version:1, date:"2023-05-01", status:"Current",  notes:"Standard form." }
    ]
  },
  {
    id:"DOC415", title:"Community Certificate Application",
    type:"ApplicationForm", department:"Revenue Department", category:"Income Certificate",
    importance:"High", keywords:["community","certificate","caste","SC","ST","OBC","application"],
    content:"Application form for obtaining community certificate (SC/ST/BC/MBC) from the Revenue Department. Required for scholarship, reservation, and job applications.",
    versions:[
      { version:1, date:"2021-01-01", status:"Outdated", notes:"Original paper form." },
      { version:2, date:"2022-06-01", status:"Outdated", notes:"Aadhaar linkage added." },
      { version:3, date:"2024-06-01", status:"Current",  notes:"E-certificate via TNeGA portal." }
    ]
  },
  {
    id:"DOC416", title:"School Building Safety Circular",
    type:"Circular", department:"Education Department", category:"Education Services",
    importance:"High", keywords:["school","building","safety","inspection","structural","education"],
    content:"Mandatory structural safety inspection of all government school buildings before academic year commencement. PWD engineers to certify safety within June 15.",
    versions:[
      { version:1, date:"2023-06-01", status:"Outdated", notes:"Previous circular." },
      { version:2, date:"2024-06-01", status:"Current",  notes:"Checklist expanded." }
    ]
  },
  {
    id:"DOC417", title:"Drinking Water Quality Test Circular",
    type:"Circular", department:"Health Department", category:"Public Health",
    importance:"High", keywords:["drinking water","quality","test","health","contamination","water borne disease"],
    content:"Circular mandating monthly drinking water quality tests at all rural water supply schemes. Reports to be submitted to District Health Officer within 5th of each month.",
    versions:[
      { version:1, date:"2024-03-01", status:"Current",  notes:"New mandate." }
    ]
  },
  {
    id:"DOC418", title:"Waste Management Guidelines",
    type:"Circular", department:"Public Works Department", category:"Public Works",
    importance:"Medium", keywords:["waste","management","solid waste","guidelines","segregation","recycling"],
    content:"Guidelines for solid waste management at village and town panchayat level including source segregation, compost pits, and recycling centres.",
    versions:[
      { version:1, date:"2023-09-01", status:"Outdated", notes:"Original." },
      { version:2, date:"2024-09-01", status:"Current",  notes:"Plastic ban enforcement added." }
    ]
  }
];

// ── Persistence via localStorage ──────────────────────────────────────
const STORAGE_KEY = "aramoffice_docs_v3";
const ACTIVITY_KEY = "aramoffice_activity_v3";

function loadDocs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return JSON.parse(JSON.stringify(INITIAL_DOCUMENTS));
}

function saveDocs(docs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(docs)); } catch(e) {}
}

function loadActivity() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return [
    { type:"blue",   text:"<strong>DOC415</strong> Community Certificate Application updated to Version 3.", time:"2 hrs ago" },
    { type:"green",  text:"<strong>DOC410</strong> Solar Panel Installation Guidelines added.", time:"1 day ago" },
    { type:"orange", text:"<strong>DOC304</strong> Mid-Day Meal Scheme – Version 2 marked Outdated.", time:"2 days ago" },
    { type:"green",  text:"<strong>DOC417</strong> Drinking Water Quality Test Circular added.", time:"3 days ago" },
    { type:"blue",   text:"<strong>DOC301</strong> Scholarship Application Guidelines updated to Version 3.", time:"4 days ago" },
  ];
}

function saveActivity(act) {
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(act)); } catch(e) {}
}

// ── Exported store object ─────────────────────────────────────────────
const Store = {
  docs: loadDocs(),
  activity: loadActivity(),

  save() { saveDocs(this.docs); },

  getAll() { return this.docs; },

  getById(id) { return this.docs.find(d => d.id === id) || null; },

  idExists(id) { return this.docs.some(d => d.id === id); },

  addDoc(doc) {
    this.docs.push(doc);
    this.save();
    this.pushActivity("green", `<strong>${doc.id}</strong> ${doc.title} added.`);
  },

  updateDoc(id, changes) {
    const idx = this.docs.findIndex(d => d.id === id);
    if (idx !== -1) {
      Object.assign(this.docs[idx], changes);
      this.save();
      this.pushActivity("blue", `<strong>${id}</strong> metadata updated.`);
    }
  },

  addVersion(id, notes) {
    const doc = this.getById(id);
    if (!doc) return false;
    // Mark all existing versions outdated
    doc.versions.forEach(v => v.status = "Outdated");
    const newVer = {
      version: doc.versions.length + 1,
      date: new Date().toISOString().slice(0, 10),
      status: "Current",
      notes: notes || "New version added."
    };
    doc.versions.push(newVer);
    this.save();
    this.pushActivity("orange", `<strong>${id}</strong> updated to Version ${newVer.version}. Previous version marked Outdated.`);
    return newVer.version;
  },

  currentVersion(doc) {
    return doc.versions.find(v => v.status === "Current") || doc.versions[doc.versions.length - 1];
  },

  pushActivity(type, text) {
    this.activity.unshift({ type, text, time: "Just now" });
    if (this.activity.length > 20) this.activity.pop();
    saveActivity(this.activity);
  },

  deleteDoc(id) {
    const idx = this.docs.findIndex(d => d.id === id);
    if (idx !== -1) {
      const removed = this.docs.splice(idx, 1)[0];
      this.save();
      this.pushActivity("red", `<strong>${id}</strong> "${removed.title}" was deleted.`);
      return true;
    }
    return false;
  },

  // ── Staff Authentication ──
  getStaffList() {
    try {
      const raw = localStorage.getItem("aram_office_staff_v1");
      return raw ? JSON.parse(raw) : DEFAULT_STAFF;
    } catch(e) { return DEFAULT_STAFF; }
  },

  saveStaffList(list) {
    try { localStorage.setItem("aram_office_staff_v1", JSON.stringify(list)); } catch(e) {}
  },

  getCurrentStaff() {
    try {
      const raw = localStorage.getItem("aram_office_current_staff_v1");
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return DEFAULT_STAFF[0]; // Default logged-in staff for easy demo
  },

  setCurrentStaff(staff) {
    try {
      if (!staff) localStorage.removeItem("aram_office_current_staff_v1");
      else localStorage.setItem("aram_office_current_staff_v1", JSON.stringify(staff));
    } catch(e) {}
  },

  registerStaff(data) {
    const list = this.getStaffList();
    if (list.some(s => s.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, message: "Staff member with this official email is already registered." };
    }
    if (list.some(s => s.id.toUpperCase() === data.id.toUpperCase())) {
      return { success: false, message: "Staff Employee ID is already registered." };
    }
    const newStaff = {
      ...data,
      verificationStatus: "Verified",
      verificationToken: "GOV-TN-AUTH-" + Math.floor(100000 + Math.random() * 900000),
      registeredAt: new Date().toISOString().slice(0, 10)
    };
    list.push(newStaff);
    this.saveStaffList(list);
    this.setCurrentStaff(newStaff);
    this.pushActivity("green", `Staff Officer <strong>${newStaff.name}</strong> registered & verified.`);
    return { success: true, staff: newStaff };
  },

  loginStaff(identifier, password) {
    const list = this.getStaffList();
    const idClean = identifier.trim().toLowerCase();
    const staff = list.find(s => 
      s.email.toLowerCase() === idClean || 
      s.id.toLowerCase() === idClean
    );
    if (!staff) {
      return { success: false, message: "No staff found with this Employee ID or Email." };
    }
    if (staff.password !== password) {
      return { success: false, message: "Incorrect password. Please verify credentials." };
    }
    this.setCurrentStaff(staff);
    this.pushActivity("blue", `Staff Officer <strong>${staff.name}</strong> logged in.`);
    return { success: true, staff };
  },

  logoutStaff() {
    this.setCurrentStaff(null);
    this.pushActivity("orange", `Staff session ended.`);
  },

  // Compute dashboard stats
  stats() {
    const all = this.docs;
    const totalDocs = all.length;
    const approved  = all.filter(d => this.currentVersion(d).status === "Current").length;
    const outdatedCount = all.reduce((sum, d) => sum + d.versions.filter(v => v.status === "Outdated").length, 0);
    const deptCount = new Set(all.map(d => d.department)).size;
    const catCount  = new Set(all.map(d => d.category)).size;
    const recent    = [...all].reverse().slice(0, 8);
    const byDept    = {};
    const byCat     = {};
    all.forEach(d => {
      byDept[d.department] = (byDept[d.department] || 0) + 1;
      byCat[d.category]    = (byCat[d.category]    || 0) + 1;
    });
    return { totalDocs, approved, outdatedCount, deptCount, catCount, recent, byDept, byCat };
  }
};

const DEFAULT_STAFF = [
  {
    id: "EMP-REV-1042",
    name: "Thiru. S. Ramanathan, M.A.",
    email: "ramanathan.rev@aram.tn.gov.in",
    password: "Password@123",
    department: "Revenue Department",
    designation: "Tahsildar & Executive Magistrate",
    proofType: "Government Service Identity Card",
    proofFileName: "Govt_ID_Ramanathan_REV1042.pdf",
    verificationStatus: "Verified",
    verificationToken: "GOV-TN-AUTH-2024-9841",
    registeredAt: "2024-01-10"
  },
  {
    id: "EMP-HLT-2019",
    name: "Dr. K. Meenakshi, MBBS, DPH",
    email: "meenakshi.dph@aram.tn.gov.in",
    password: "Password@123",
    department: "Health Department",
    designation: "Deputy Director of Health Services",
    proofType: "Gazetted Medical Officer Card",
    proofFileName: "Dr_Meenakshi_Gazette_ID.pdf",
    verificationStatus: "Verified",
    verificationToken: "GOV-TN-AUTH-2024-7729",
    registeredAt: "2024-02-14"
  },
  {
    id: "EMP-EDU-3088",
    name: "Tmt. P. Vasanthi, M.Sc., M.Ed.",
    email: "vasanthi.deo@aram.tn.gov.in",
    password: "Password@123",
    department: "Education Department",
    designation: "District Educational Officer (DEO)",
    proofType: "Education Department Service Register",
    proofFileName: "DEO_Service_Book_Copy.pdf",
    verificationStatus: "Verified",
    verificationToken: "GOV-TN-AUTH-2024-6310",
    registeredAt: "2024-03-01"
  }
];
