const salaryFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
})

const dateFormat = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" })

export function formatSalary(salary: string) {
  return salaryFormat.format(Number(salary))
}

export function formatDate(date: string) {
  return dateFormat.format(new Date(date))
}

export function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}
