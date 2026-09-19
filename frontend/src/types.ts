export interface User {
  id: number;
  email: string;
}

export interface Department {
  id: number;
  name: string;
  color: string;
}

export interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  salary: string;
  role: string;
  manager_id: number | null;
  avatar_key: string | null;
  department: Department | null;
  avatar_url: string;
}

export interface Stats {
  employee_count: number;
  department_count: number;
  average_salary: string | null;
  without_manager: number;
  headcount_by_department: {
    name: string;
    color: string;
    employee_count: number;
  }[];
  salary_by_role: {
    role: string;
    employee_count: number;
    average_salary: string;
  }[];
}
