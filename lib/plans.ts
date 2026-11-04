// Role plan per client: who is needed, which skills, and how many start each month.
// Months run Nov-26 to Aug-27. To give a deal a real plan, add an entry here
// (match = regex on the prospect name in the pipeline table).
export const MONTHS = ["Nov-26","Dec-26","Jan-27","Feb-27","Mar-27","Apr-27","May-27","Jun-27","Jul-27","Aug-27"];

export type EmpType = "P" | "C" | "B" | "Pt";
export const TYPE_LABEL: Record<EmpType, string> = { P: "Permanent", C: "Contract", B: "UTS bench", Pt: "Partner" };

export type Role = { role: string; skills: string; type: EmpType; jd: string; adds: number[] };
export type Plan = { key: string; label: string; match: RegExp | null; roles: Role[] };

export const PLANS: Plan[] = [
  { key: "tescom", label: "Tescom", match: /tescom/i, roles: [
    { role: "MES program manager, 16 yrs", skills: "MES implementation, program governance", type: "P", jd: "mes-pm", adds: [1] },
    { role: "Integration architect (bridge)", skills: "MES-ERP-PLC integration, APIs, OPC UA", type: "C", jd: "integration-architect", adds: [1] },
    { role: "Integration architect, 8-10 yrs", skills: "MES-ERP-PLC integration, solution design", type: "P", jd: "integration-architect", adds: [0, 0, 1] },
  ] },
  { key: "timex", label: "Timex", match: /timex/i, roles: [
    { role: "Program manager, 20 yrs", skills: "Large manufacturing programs, client governance", type: "P", jd: "program-pm", adds: [0, 0, 1] },
    { role: "Simulation / data engineers", skills: "Discrete event simulation, Python, SQL", type: "P", jd: "sim-data-engineer", adds: [0, 0, 2, 0, 0, 0, 1] },
    { role: "Field engineer, Noida", skills: "Plant commissioning, data capture, PLC basics", type: "P", jd: "field-engineer", adds: [0, 0, 0, 1] },
  ] },
  { key: "logesys", label: "Logesys", match: /logesys/i, roles: [
    { role: "IoT lead architect, 12+ yrs", skills: "IoT architecture, MQTT, edge-to-cloud", type: "C", jd: "iot-architect", adds: [0, 0, 1] },
    { role: "Firmware engineers", skills: "Embedded C/C++, ESP32/STM32, BLE/GSM, OTA", type: "C", jd: "firmware-engineer", adds: [0, 0, 1, 1] },
    { role: "Cloud / backend engineers", skills: "Node or Python, MQTT, time-series DB, AWS/Azure", type: "C", jd: "cloud-backend-engineer", adds: [0, 0, 1, 1] },
    { role: "Mobile / dashboard engineer", skills: "React Native or Flutter, dashboards, alerts", type: "C", jd: "mobile-engineer", adds: [0, 0, 0, 1] },
    { role: "QA / test engineer", skills: "Device and API testing, automation", type: "C", jd: "qa-engineer", adds: [0, 0, 0, 1] },
    { role: "Delivery PM", skills: "IoT delivery, vendor coordination", type: "C", jd: "delivery-pm", adds: [0, 0, 0, 1] },
    { role: "On-ground deployment, UAE", skills: "Device installation, site survey", type: "Pt", jd: "onground-engineer", adds: [0, 0, 0, 0, 2, 2] },
    { role: "AMC lead, remote", skills: "Support SLAs, incident management", type: "C", jd: "amc-lead", adds: [0, 0, 0, 0, 0, 0, 1] },
  ] },
  { key: "dixon", label: "UST - Dixon", match: /dixon/i, roles: [
    { role: "Program lead", skills: "MES programs for EMS, client governance", type: "B", jd: "mes-program-lead", adds: [0, 1] },
    { role: "MES solution architect", skills: "MES architecture, traceability, custom build", type: "B", jd: "mes-architect", adds: [0, 1] },
    { role: "Functional consultant, EMS", skills: "EMS process flows, requirements", type: "B", jd: "mes-functional-consultant", adds: [0, 1] },
    { role: "MES developers", skills: "Backend and web development, SQL, REST", type: "B", jd: "mes-developer", adds: [0, 2, 1] },
    { role: "Integration engineer, ERP/PLC", skills: "ERP connectors, PLC/OPC UA, middleware", type: "B", jd: "integration-engineer", adds: [0, 0, 1] },
    { role: "QA engineer", skills: "MES test planning, UAT support", type: "B", jd: "qa-engineer", adds: [0, 0, 1] },
  ] },
  { key: "quest", label: "Qwest - Renesas", match: /renesas|qwest|quest/i, roles: [
    { role: "Siemens Opcenter MES consultant", skills: "Opcenter configuration, semiconductor MES", type: "C", jd: "opcenter-consultant", adds: [0, 0, 0, 1] },
  ] },
  { key: "tvs", label: "TVS Sundaram", match: /tvs/i, roles: [
    { role: "IoT / data engineer", skills: "Sensor data capture, Python, inventory reconciliation", type: "C", jd: "iot-data-engineer", adds: [0, 0, 1] },
  ] },
  { key: "core", label: "Core team", match: null, roles: [
    { role: "BD / partnerships lead", skills: "B2B manufacturing sales, channel partnerships", type: "P", jd: "bd-lead", adds: [0, 0, 0, 0, 0, 0, 0, 0, 1] },
  ] },
];
