import type { ColumnDefinition, TableData } from "@/components/table/types"

// Sample data generators
const names = [
  "Alice Johnson",
  "Bob Smith",
  "Charlie Brown",
  "Diana Prince",
  "Edward Norton",
  "Fiona Apple",
  "George Washington",
  "Hannah Montana",
  "Isaac Newton",
  "Julia Roberts",
]

export const companies = [
  "Acme Corp",
  "Tech Solutions Inc",
  "Global Industries",
  "Digital Ventures",
  "Innovation Labs",
  "Future Systems",
  "Cloud Services Co",
  "Data Analytics Ltd",
  "Software Solutions",
  "Enterprise Group",
]

const descriptions = [
  "Senior Software Engineer with 10+ years of experience",
  "Product Manager specializing in SaaS platforms",
  "Data Scientist working on machine learning models",
  "UX Designer creating beautiful user experiences",
  "DevOps Engineer managing cloud infrastructure",
  "Marketing Director driving growth strategies",
  "Sales Executive closing enterprise deals",
  "Customer Success Manager ensuring client satisfaction",
  "Research Scientist developing new technologies",
  "Business Analyst optimizing operations",
]

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function generateData(count: number = 100): TableData[] {
  const data: TableData[] = []

  for (let i = 0; i < count; i++) {
    data.push({
      id: i + 1,
      name: randomElement(names),
      company: randomElement(companies),
      age: randomInt(22, 65),
      salary: randomFloat(50000, 200000),
      active: Math.random() > 0.3,
      score: randomFloat(0, 100),
      description: `${randomElement(descriptions)}. ID: ${i + 1}. This is a detailed description that contains more information about the person and their role in the organization.`,
    })
  }

  return data
}

export const columns: ColumnDefinition[] = [
  {
    key: "id",
    header: "ID",
    type: "number",
  },
  {
    key: "name",
    header: "Name",
    type: "text",
  },
  {
    key: "company",
    header: "Company",
    type: "text",
  },
  {
    key: "age",
    header: "Age",
    type: "number",
  },
  {
    key: "salary",
    header: "Salary",
    type: "number",
    format: "currency",
  },
  {
    key: "active",
    header: "Active",
    type: "boolean",
  },
  {
    key: "score",
    header: "Score",
    type: "number",
    format: "percentage",
  },
  {
    key: "description",
    header: "Description",
    type: "popper",
    triggerText: "View Details",
  },
]

