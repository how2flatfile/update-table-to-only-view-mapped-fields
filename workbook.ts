import { SheetConfig } from "@flatfile/api/api";

// Defining the structure of our Contacts sheet 
const contactsSheet: SheetConfig = {
    name: 'Contacts',
    slug: 'contacts',
    fields: [
        {
            key: "first_name",
            type: "string",
            label: "First name",
        },
        {
            key: "last_name",
            type: "string",
            label: "Last name",
        },
        // When testing the Submit action, do not map this field during the Matching stage to witness how Submit action will not pass this field to webhook.site
        {
            key: "full_name",
            type: "string",
            label: "Full name (DO NOT MAP)",
        },
        {
            key: "email",
            type: "string",
            label: "Email",
        },
        // When testing the Submit action, do not map this field during the Matching stage to witness how Submit action will not pass this field to webhook.site
        {
            key: "country_of_birth",
            label: "Country of birth (DO NOT MAP)",
            type: "string"
        }
    ],
}

const companiesSheet: SheetConfig = {
    name: 'Companies',
    slug: 'companies',
    fields: [
        {
            key: "company_name",
            type: "string",
            label: "Company name",
        },
        // When testing the Submit action, do not map this field during the Matching stage to witness how Submit action will not pass this field to webhook.site
        {
            key: "address",
            type: "string",
            label: "Address (DO NOT MAP)",
        },
    ]
}

// Exporting Contacts sheet as part of a Workbook defined as workbookOne. We import this Workbook to index.ts to then create a space with this Workbook's configuration
export const workbookOne = [{ ...contactsSheet }, { ...companiesSheet }];