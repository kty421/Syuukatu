import type { Company, SelectionStatus } from "../types";
import type { groupCompaniesByStatus } from "./companyUtils";

export type CompanyListItem =
  | {
      kind: "section";
      id: string;
      status: SelectionStatus;
      count: number;
      hasStatusBoundary: boolean;
    }
  | {
      kind: "company";
      id: string;
      status: SelectionStatus;
      company: Company;
      isFirst: boolean;
      isLast: boolean;
    };

const closedStatuses = new Set<SelectionStatus>(["落選", "辞退", "完了"]);

export const buildCompanyListItems = (
  groups: ReturnType<typeof groupCompaniesByStatus>,
): CompanyListItem[] => {
  const firstClosedIndex = groups.findIndex((group) =>
    closedStatuses.has(group.status),
  );

  return groups.flatMap((group, index) => [
    {
      kind: "section",
      id: `section:${group.status}`,
      status: group.status,
      count: group.companies.length,
      hasStatusBoundary: firstClosedIndex > 0 && index === firstClosedIndex,
    },
    ...group.companies.map((company, companyIndex) => ({
      kind: "company" as const,
      id: company.id,
      status: group.status,
      company,
      isFirst: companyIndex === 0,
      isLast: companyIndex === group.companies.length - 1,
    })),
  ]);
};
