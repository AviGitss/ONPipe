import { TYPE_LABEL, type EmpType } from "@/lib/plans";

export type JD = {
  title: string; level: string; location: string; summary: string;
  does: string[]; must: string[]; nice: string[];
};

export const COMPANY_LINE =
  "Open Netrikkan, part of UTS (backed by Indicore and Axilor Ventures), builds simulation and MES-led solutions for manufacturing and logistics, from Bengaluru.";

const BLR = "Bengaluru (hybrid)";

export const JDS: Record<string, JD> = {
  "mes-pm": { title: "MES Program Manager", level: "15+ years", location: BLR,
    summary: "Own delivery of an MES implementation from design to go-live at a discrete manufacturing client.",
    does: ["Own scope, plan, budget and risks for the MES programme", "Run weekly governance with the client plant and IT heads", "Direct architects, consultants and developers; remove blockers", "Manage change requests and acceptance milestones", "Report progress and margin to leadership"],
    must: ["10+ years running MES, MOM or large manufacturing IT programmes", "Shop-floor and ERP integration experience", "Strong stakeholder and commercial management", "Fixed-scope delivery and risk management"],
    nice: ["Siemens Opcenter, Camstar or similar MES product", "PMP or equivalent", "Automotive or electronics plant exposure"] },
  "integration-architect": { title: "Integration Architect (MES / ERP / PLC)", level: "8-10 years", location: BLR,
    summary: "Design and own the integration layer between the MES, ERP and shop-floor equipment.",
    does: ["Define integration architecture across MES, ERP, PLC and SCADA", "Design APIs, message flows and data contracts", "Review developer work and guide integration engineers", "Own technical scope and sign-off with the client IT team", "Troubleshoot production integration issues"],
    must: ["8+ years in industrial or enterprise integration", "OPC UA, MQTT and REST/SOAP APIs", "SQL and one of Java, C# or Python", "Experience integrating ERP (SAP or similar) with shop-floor systems"],
    nice: ["MES product experience", "Message brokers such as Kafka or RabbitMQ", "Docker and CI/CD"] },
  "program-pm": { title: "Program Manager, Manufacturing Programs", level: "18+ years", location: "Bengaluru, with Noida site visits",
    summary: "Lead a multi-workstream simulation and data programme for a large manufacturer.",
    does: ["Own the programme plan, budget, staffing and risks", "Lead steering reviews with client senior management", "Coordinate simulation, data and field teams", "Manage scope changes and commercial terms", "Build the team through hiring and mentoring"],
    must: ["15+ years delivering large manufacturing or digital programmes", "Experience managing multi-site programmes and distributed teams", "Strong executive communication", "P&L or project margin ownership"],
    nice: ["Simulation, OEE or MES programmes", "Consumer durables or electronics manufacturing", "PMP"] },
  "sim-data-engineer": { title: "Simulation and Data Engineer", level: "3-5 years", location: BLR,
    summary: "Build discrete event simulations of factory lines from plant data.",
    does: ["Collect and clean production, downtime and routing data", "Build and validate discrete event simulation models", "Run what-if scenarios and prepare findings for clients", "Write data pipelines in Python and SQL", "Document assumptions and model versions"],
    must: ["3+ years in Python and SQL", "Understanding of manufacturing flow, OEE and queues", "Discrete event simulation or operations research background", "Clear written communication"],
    nice: ["SimPy, AnyLogic or Arena", "Industrial engineering degree", "Power BI or Grafana"] },
  "field-engineer": { title: "Field Engineer, Plant Data and Commissioning", level: "3-6 years", location: "Noida, on-site at client plant",
    summary: "Be our hands at the client plant: connect equipment, capture data and keep the system running.",
    does: ["Survey lines and install data capture hardware", "Connect to PLCs, counters and sensors", "Validate data against shop-floor reality", "Train plant staff on the dashboards", "Log issues and escalate to the core team"],
    must: ["Diploma or degree in electrical, electronics or instrumentation", "Hands-on PLC and sensor wiring experience", "Willing to work on the shop floor daily", "Basic networking and Linux skills"],
    nice: ["Modbus, OPC UA", "Prior plant IoT deployments", "Hindi and English fluency"] },
  "iot-architect": { title: "IoT Lead Architect", level: "12+ years", location: BLR,
    summary: "Architect an end-to-end IoT system that monitors freezers and sends replenishment alerts.",
    does: ["Define device, connectivity, cloud and mobile architecture", "Choose protocols, hardware and cloud services", "Set security, OTA and data retention design", "Lead firmware, backend and mobile engineers", "Support the client on deployment and scale-up"],
    must: ["12+ years in embedded and IoT systems", "Designed and shipped a connected-device product", "MQTT, BLE, Wi-Fi or GSM connectivity", "Cloud architecture on AWS or Azure IoT", "Team leadership"],
    nice: ["Cold chain or retail telemetry", "Middle East deployments", "Cost-optimised BOM design"] },
  "firmware-engineer": { title: "Firmware Engineer", level: "4-8 years", location: BLR,
    summary: "Write reliable firmware for battery or mains powered sensing devices.",
    does: ["Develop firmware for temperature and door sensing nodes", "Implement connectivity, buffering and retries", "Build secure OTA update support", "Support hardware bring-up and field debugging", "Write unit and hardware-in-loop tests"],
    must: ["Embedded C or C++", "ESP32 or STM32 experience", "BLE, Wi-Fi or GSM modules", "RTOS basics", "Low-power design"],
    nice: ["MQTT on constrained devices", "Zephyr or FreeRTOS", "Production test fixtures"] },
  "cloud-backend-engineer": { title: "Cloud / Backend Engineer (IoT)", level: "4-8 years", location: BLR,
    summary: "Build the cloud backend that ingests device data and raises alerts.",
    does: ["Build ingestion APIs and MQTT pipelines", "Design time-series storage and alert rules", "Build admin and reporting APIs for the dashboard", "Set up monitoring, logging and cost controls", "Write automated tests and deployment scripts"],
    must: ["Node.js or Python backend experience", "MQTT or AWS IoT Core or Azure IoT Hub", "PostgreSQL and a time-series database", "REST API design", "Cloud deployment and CI/CD"],
    nice: ["Multi-tenant SaaS", "Alerting via WhatsApp or SMS gateways", "Terraform"] },
  "mobile-engineer": { title: "Mobile / Dashboard Engineer", level: "3-6 years", location: BLR,
    summary: "Build the app and dashboard that show freezer status and alerts.",
    does: ["Build mobile and web dashboards", "Implement push and in-app alerts", "Build role-based views for field and admin staff", "Work with design on simple, reliable screens", "Ship and maintain app releases"],
    must: ["React Native or Flutter", "REST and WebSocket integration", "Chart and map libraries", "App store release experience"],
    nice: ["Arabic and RTL support", "Offline-first apps", "React web dashboards"] },
  "qa-engineer": { title: "QA / Test Engineer", level: "3-6 years", location: BLR,
    summary: "Plan and run testing for industrial software and connected devices.",
    does: ["Write test plans and cases from requirements", "Run functional, API and regression tests", "Automate repeatable tests", "Support client UAT and defect triage", "Report quality metrics to the delivery lead"],
    must: ["3+ years in software QA", "API testing with Postman or similar", "Test automation in Python, Java or JavaScript", "Clear defect reporting"],
    nice: ["MES or IoT testing", "Device test rigs", "JMeter or k6"] },
  "delivery-pm": { title: "Delivery Project Manager (IoT)", level: "8-12 years", location: "Bengaluru, with UAE travel",
    summary: "Run delivery of a fixed-scope IoT project with a UAE client.",
    does: ["Plan sprints and track hardware and software milestones", "Coordinate vendors, firmware, backend and mobile teams", "Run weekly client calls across time zones", "Manage deployment logistics with on-ground partners", "Track budget, risks and acceptance"],
    must: ["8+ years managing software or IoT projects", "Experience with hardware supply chains and rollouts", "Strong written and spoken English", "Client-facing delivery experience"],
    nice: ["GCC clients", "PMP or Scrum certification", "Cold chain or retail IoT"] },
  "onground-engineer": { title: "On-ground Deployment Engineer, UAE", level: "2-5 years", location: "UAE, on-site (partner supplied)",
    summary: "Install and commission IoT devices at client sites across the UAE.",
    does: ["Survey sites and install sensors and gateways", "Commission and test each device against the dashboard", "Replace faulty units and log field issues", "Keep installation records and photos", "Support the remote AMC team"],
    must: ["Electrical or electronics background", "Hands-on installation experience", "Valid UAE work authorisation through the partner", "Driving licence", "English communication"],
    nice: ["Cold chain or refrigeration exposure", "Arabic", "Basic networking"] },
  "amc-lead": { title: "AMC Lead (Remote Support)", level: "6-10 years", location: "Remote",
    summary: "Lead annual maintenance support for the deployed IoT fleet.",
    does: ["Run the support desk and SLAs", "Monitor fleet health and alert quality", "Coordinate on-ground technicians", "Manage incidents and root cause reviews", "Report uptime and service credits monthly"],
    must: ["6+ years in IT or IoT support leadership", "Incident and SLA management", "Remote monitoring tools", "Customer communication"],
    nice: ["Grafana or Datadog", "ITIL", "UAE market"] },
  "mes-program-lead": { title: "MES Program Lead (EMS)", level: "12+ years", location: "Bengaluru (UTS facility)",
    summary: "Lead a team of about eight building a custom MES for an EMS manufacturer.",
    does: ["Own plan, scope and governance for the MES build", "Lead the architect, consultants and developers", "Run client reviews with the front-end partner", "Control change requests and releases", "Report delivery health weekly"],
    must: ["10+ years leading MES or manufacturing software delivery", "EMS or electronics manufacturing exposure", "Managing teams of 8 or more", "Agile delivery for fixed-scope work"],
    nice: ["SMT, test and packing line knowledge", "Custom MES builds"] },
  "mes-architect": { title: "MES Solution Architect", level: "10+ years", location: "Bengaluru (UTS facility)",
    summary: "Design the architecture of a custom-built MES for an EMS plant.",
    does: ["Define modules for WIP tracking, traceability and quality", "Design data model, APIs and integration with ERP and machines", "Set coding standards and review key code", "Resolve technical questions from the client", "Plan for scale across multiple plants"],
    must: ["10+ years in enterprise or MES architecture", "Strong data modelling and API design", "Traceability and genealogy design", "Micro-service or modular monolith patterns", "Cloud or on-premise deployment"],
    nice: ["EMS or SMT traceability", "Event-driven design", "Siemens Opcenter or Camstar background"] },
  "mes-functional-consultant": { title: "Functional Consultant, EMS", level: "7-12 years", location: "Bengaluru (UTS facility), client visits",
    summary: "Translate EMS shop-floor processes into MES requirements and test them with the client.",
    does: ["Run workshops with production, quality and planning teams", "Write functional specifications and acceptance criteria", "Map SMT, test, assembly and packing flows", "Support UAT and training", "Bridge between client users and developers"],
    must: ["7+ years in MES functional consulting or EMS operations", "Understanding of routing, work orders and traceability", "Excellent documentation", "Client workshop facilitation"],
    nice: ["IPC standards", "Siemens Opcenter or similar", "Quality and NCR processes"] },
  "mes-developer": { title: "MES Developer", level: "3-7 years", location: "Bengaluru (UTS facility)",
    summary: "Build modules of a custom MES.",
    does: ["Develop backend services and shop-floor screens", "Write SQL and reporting queries", "Build integrations with ERP and machines", "Write unit tests and fix defects", "Take part in code reviews"],
    must: ["3+ years in Java, C# or Python backend development", "SQL databases", "REST APIs", "Web UI with React or Angular", "Git and CI"],
    nice: ["Manufacturing domain knowledge", "OPC UA", "Docker"] },
  "integration-engineer": { title: "Integration Engineer (ERP / PLC)", level: "4-8 years", location: "Bengaluru (UTS facility)",
    summary: "Connect the MES to ERP and shop-floor equipment.",
    does: ["Build and test ERP interfaces for orders, BOMs and stock", "Connect PLCs and machines over OPC UA, Modbus or file drops", "Handle retries, mapping and error queues", "Monitor integrations in test and production", "Document interface specs"],
    must: ["4+ years in integration engineering", "REST, SOAP and message queues", "OPC UA or Modbus", "SQL", "Debugging distributed systems"],
    nice: ["SAP or Oracle interfaces", "Node-RED", "Kafka"] },
  "opcenter-consultant": { title: "Siemens Opcenter MES Consultant", level: "8+ years", location: "Bengaluru (hybrid), contract",
    summary: "Configure and advise on a Siemens Opcenter MES for a semiconductor client engagement.",
    does: ["Configure Opcenter Execution (Camstar) models and workflows", "Review the MES bid and design against client needs", "Support integration and data collection design", "Advise the delivery team and client", "Document configuration and test results"],
    must: ["Hands-on Siemens Opcenter or Camstar configuration", "Semiconductor or high-mix MES exposure", "Workflow, data collection and traceability design", "Consulting communication"],
    nice: ["Opcenter Execution Foundation", "Fab or OSAT experience", "Integration with SAP"] },
  "iot-data-engineer": { title: "IoT / Data Engineer", level: "3-6 years", location: "Bengaluru or Hosur, on-site visits",
    summary: "Capture plant data and reconcile it against inventory records to find leaks.",
    does: ["Set up sensors, counters and data capture on the line", "Build pipelines to compare actual with planned material use", "Prepare daily variance reports", "Support the plant team in root cause review", "Document data definitions"],
    must: ["3+ years in Python and SQL", "Sensor or PLC data capture experience", "Data quality and reconciliation skills", "Comfortable working at a plant"],
    nice: ["Cold forging or metal forming exposure", "Power BI", "Edge gateways"] },
  "bd-lead": { title: "BD / Partnerships Lead", level: "10+ years", location: "Bengaluru, with travel",
    summary: "Build the pipeline for simulation and MES services through direct sales and channel partners.",
    does: ["Own the pipeline and annual revenue target", "Build relationships with plant heads, CIOs and consulting partners", "Lead proposals, pricing and negotiations", "Create channel partnerships with systems integrators", "Report forecast and win-loss learnings"],
    must: ["10+ years in B2B technology or manufacturing sales", "Closed enterprise deals in Indian manufacturing", "Channel or alliance experience", "Strong proposal and pricing skills"],
    nice: ["Industry 4.0, MES or simulation selling", "Network across automotive and EMS", "Startup experience"] },
};

export function jdFor(key: string): JD | undefined { return JDS[key]; }

export function jdText(jd: JD, ctx: { client?: string; type?: EmpType; openings?: number; neededBy?: string | null }): string {
  const L: string[] = [];
  L.push(`${jd.title}`);
  L.push(`Experience: ${jd.level}`);
  L.push(`Location: ${jd.location}`);
  if (ctx.type) L.push(`Engagement: ${TYPE_LABEL[ctx.type]}`);
  if (ctx.openings) L.push(`Openings: ${ctx.openings}`);
  if (ctx.neededBy) L.push(`Needed by: ${ctx.neededBy}`);
  L.push("", "About us", COMPANY_LINE, "", "The role", jd.summary, "", "What you will do");
  jd.does.forEach(x => L.push(`- ${x}`));
  L.push("", "Must have");
  jd.must.forEach(x => L.push(`- ${x}`));
  L.push("", "Good to have");
  jd.nice.forEach(x => L.push(`- ${x}`));
  L.push("", "To apply, send your CV to sskumar@opennetrikkan.com with the job title in the subject.");
  return L.join("\n");
}
