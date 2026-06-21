type CompanyListItem = {
  id: string;
  updatedAt?: string;
};

const toTime = (value?: string) => {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

export const sortCompaniesByUpdatedAt = <TCompany extends CompanyListItem>(
  companies: TCompany[]
) =>
  [...companies].sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt));

export const upsertCompanyInList = <TCompany extends CompanyListItem>(
  companies: TCompany[] | undefined,
  nextCompany: TCompany
) => {
  const currentCompanies = companies ?? [];
  const exists = currentCompanies.some((company) => company.id === nextCompany.id);
  const nextCompanies = exists
    ? currentCompanies.map((company) =>
        company.id === nextCompany.id ? nextCompany : company
      )
    : [nextCompany, ...currentCompanies];

  return sortCompaniesByUpdatedAt(nextCompanies);
};

export const deleteCompanyFromList = <TCompany extends CompanyListItem>(
  companies: TCompany[] | undefined,
  companyId: string
) => (companies ?? []).filter((company) => company.id !== companyId);
