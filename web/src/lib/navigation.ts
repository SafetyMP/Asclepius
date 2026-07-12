export type NavItem = {
  href: string;
  label: string;
};

export const asclepiusNav: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/patients", label: "Patients" },
  { href: "/interactions", label: "Drug interactions" },
  { href: "/cds", label: "Clinical decision support" },
  { href: "/validate", label: "Validate resource" },
  { href: "/auth", label: "Dev auth" },
];
