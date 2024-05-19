// Importing the packages and variables we need to run the code below
import { Client, FlatfileEvent, FlatfileListener } from "@flatfile/listener";
import api from "@flatfile/api";
import axios from "axios";
import { workbookOne } from "./workbook";

// We use webhook.site to simulate a backend database where data will be submitted (switch the link below to your link, found on webhook.site)
const webhookReceiver = "https://webhook.site/3d6f2ece-c9ef-4ab8-b2c2-efe2312759d2"

// Defining the main function inside of which all the code will execute
export default function flatfileEventListener(listener: Client) {

  // Restricting the code below to apply only to a specific app that has "appOne" namespace
  listener.namespace(["*:appOne"], (appOne: FlatfileListener) => {

    // Defining what needs to be done when a new space gets created
    appOne.filter({ job: "space:configure" }).on("job:ready", async (event: FlatfileEvent) => {

      // Accessing the elements we need from event.context to create a space, a workbook, its 2 sheets, and a workbook-level Submit action
      const { jobId, spaceId } = event.context;

      try {

        // First, we acknowledge the job
        await api.jobs.ack(jobId, {
          info: "Acknowledging the 'space:configure' job that is ready to execute and create a space with 1 workbook, 2 sheets and a workbook-level Submit action",
          progress: 10,
        });

        // Second, we make an API call to create a Workbook (Wokbook One), its 2 sheets (Contacts and Companies), and a workbook-level Submit button
        await api.workbooks.create({
          spaceId,
          name: "Workbook One",
          // We defined the structure of workbookOne in the "workbook.ts" file and imported it here to the "index.ts" file
          sheets: workbookOne,
          actions: [
            {
              operation: "submitAction",
              // This ensures that after a user clicks on the Submit button, a modal will appear to show that submission is in progress
              mode: "foreground",
              label: "Submit",
              // This ensures that the action is more visibly present at the top-right of the Importer
              primary: true,
            },
          ],
        });

        // Third, we complete a job once a Space is created and a Workbook, its 2 sheets, and the Submit button are created and attached to it
        await api.jobs.complete(jobId, {
          outcome: {
            message: "Space is created with 1 worksbook, 2 sheets, and a workbook-level Submit button",
          },
        });

      } catch (error) {

        // In case something goes wrong and the "space:configure" job cannot be completed, we fail the job with a message on what next steps to take
        await api.jobs.fail(jobId, {
          outcome: {
            message: "Creating a Space encountered an error. See Event Logs.",
          },
        });

      }
    });

    // Defining what needs to be done when Flatfile is done mapping columns based on user input during the Mapping stage of the import process
    appOne.filter({ job: "workbook:map" }).on("job:completed", async ({ context: { jobId, workbookId } }) => {

      // Creating a custom job that we will use in the next listener to ensure users only see mapped fields in the table
      await api.jobs.create({
        type: "workbook",
        operation: "viewMappedFieldsOnly",
        source: workbookId,
        // This ensures that our custom job will execute automatically when the "job:ready" event of the listener below triggers
        trigger: "immediate",
        // This ensures that users are not able to interact with records in the table until it is updated to only show mapped fields
        mode: "foreground",
        // This ensures that in the next listener we are able to access the jobId of the mapping job specifically, and not just the jobId of this custom job
        input: { mappingJobId: jobId }
      })

    })

    // Defining what needs to be done when our custom job triggers. Because we create it when mapping job completes, this is when this job will begin executing
    appOne.filter({ job: "workbook:viewMappedFieldsOnly" }).on("job:ready", async ({ context: { jobId, workbookId } }) => {

      try {

        // First, we acknowledge the job
        await api.jobs.ack(jobId, {
          info: "Updating the table to only view mapped fields",
          progress: 10
        })

        // Retrieving the info on the custom job we created in the listener above, and storing that info in its own "customJobInfo" variable
        const customJobInfo = await api.jobs.get(jobId)

        // From "customJobInfo" variable, retrieving the jobId specifically of the mapping job that completed, and storing it in its own "mappingJobId" variable
        const mappingJobId = customJobInfo.data.input.mappingJobId

        // Obtaining the mapping job's execution plan to later extract "fieldMapping" out of it, which tells us which fields were mapped in the Matching step
        const jobPlan = await api.jobs.getExecutionPlan(mappingJobId)

        // Initializing an empty array to store the keys of the mapped fields
        const mappedFields = [];

        // Iterating through all destination fields that are mapped and extracting their field keys. Then, pushing keys of mapped fields to the "mappedFields" variable
        for (let i = 0; i < jobPlan.data.plan.fieldMapping.length; i++) {
          const destinationFieldKey = jobPlan.data.plan.fieldMapping[i].destinationField.key;

          mappedFields.push(destinationFieldKey);
        }

        // Looping through all sheets of the Workbook One. For all fields that are mapped, updating those fields' metadata to "{mapped: true}"
        workbookOne.forEach(sheet => {
          sheet.fields.forEach(field => {
            if (mappedFields.includes(field.key)) {
              field.metadata = { mapped: true };
            }
          });
        });

        // Looping over each sheet in "workbookOne" and filtering for fields with metadata "mapped: true". Saving mapped fields per each sheet inside of "filteredWorkbookFields" varibable
        const filteredWorkbookFields = workbookOne.map(sheet => {

          const fields = sheet.fields.filter(field => field.metadata && field.metadata.mapped === true);
          return fields.length > 0 ? fields : null

        });

        // Making an API call to only get the "data" property out of the response, and saving it as its own "fetchedWorkbook" variable
        // We need to make this API call and cannot just use what's inside of "workbookOne" because we need data in a specific format
        const { data: fetchedWorkbook } = await api.workbooks.get(workbookId)

        // Updating each sheet in a workbook to only contain fields that a user mapped. This ensures that when the table with data loads, only mapped fields will be displayed
        await api.workbooks.update(workbookId, {

          // Keeping other non-sheet elements of the workbook untouched (Workbook name, its Submit action, etc)
          ...fetchedWorkbook,

          // Mapping over each sheet to update each to only contain fields that are inside of "filteredWorkbookFields" variable (that have metadata "{mapped: true})"
          sheets: fetchedWorkbook.sheets.map((sheet, index) => {

            const mappedWorkbookFields = filteredWorkbookFields[index];

            // If there are no mapped fields, returning the original sheet structure
            if (!mappedWorkbookFields) {
              return sheet;
            }

            // If there are mapped fields, returning all properties of the original sheet but updating the "fields" property to the mapped fields
            return {
              ...sheet,
              config: {
                ...sheet.config,
                fields: mappedWorkbookFields
              }
            };

          })

        })

        // Completing the job with an appropriate message to the user
        await api.jobs.complete(jobId, {
          outcome: {
            message: "Table update complete. Please audit the data",
            acknowledge: true
          }
        })

      } catch (error) {

        // If something goes wrong while executing the custom job, we fail the job with a message on what next steps to take
        await api.jobs.fail(jobId, {
          outcome: {
            message: "An error occured while updating the workbook. See Event Logs.",
          },

        });
      }

    })

    // Defining what needs to be done when a user clicks the Submit button to send the data to the database
    appOne.filter({ job: "workbook:submitAction" }).on("job:ready", async (event: FlatfileEvent) => {

      // Extracting the necessary information from event.context that we will use below
      const { jobId, workbookId } = event.context;

      try {

        // Acknowledging the job
        await api.jobs.ack(jobId, {
          info: "Acknowledging the Submit job that is now ready to execute",
          progress: 10,
        });

        // Retrieving a list of sheets associated with a workbook
        const { data: sheets } = await api.sheets.list({ workbookId });

        // Initializing "records" object that will store data fetched from individual sheets. Right now it is empty
        const records: { [name: string]: any } = {};

        // For each sheet, looping through fields to find those with metadata "mapped: true". For those fields, we fetch their records and push them to "records" object
        for (const sheet of sheets) {

          try {

            const { data: sheetDetails } = await api.sheets.get(sheet.id);

            for (const field of sheetDetails.config.fields) {

              if (field.metadata && field.metadata.mapped === true) {
                const recordData = await api.records.get(sheet.id);
                records[`Sheet ID: ${sheet.id}`] = recordData;
              }

            }

          } catch (error) {
            console.error(`Failed to fetch data for sheet ${sheet.id}: ${error}`);
          }

        }

        // For each sheet, sending data of mapped fields and their records to our sample database using axios POST call
        const response = await axios.post(

          webhookReceiver,
          {
            records
          },
          {
            headers:
              { "Content-Type": "application/json" }
          }

        )

        // If the axios POST call fails, we throw the error below
        if (response.status !== 200) {
          throw new Error("Failed to submit data to webhook.site");
        }

        // Filtering to only get the "data" property from the API response, and saving the filtered view of the response as its own "fetchedWorkbook" variable
        const { data: fetchedWorkbook } = await api.workbooks.get(workbookId)

        // Updating the workbook to delete metadata "mapped: true" from mapped fields, so if a user tries to submit data again, duplicate info won't be sent to our sample database
        await api.workbooks.update(workbookId, {

          // Keeping other non-sheet elements of the workbook untouched (such as Workbook name)
          ...fetchedWorkbook,

          // For fields of each sheet, deleting metadata "mapped: true" for fields that contain it
          sheets: fetchedWorkbook.sheets.map(sheet => {

            const newFields = sheet.config.fields.map(field => {

              const newField = { ...field };

              if (newField.metadata && newField.metadata.mapped) {
                delete newField.metadata.mapped;
              }

              return newField;

            });

            // Returning original properties for each sheet, but updating "fields" property with deleted "mapped: true" metadata
            return {
              ...sheet,
              config: {
                ...sheet.config,
                fields: newFields
              }
            }

          })
        })

        // Completing the job with an appropriate message to the user
        await api.jobs.complete(jobId, {

          outcome: {
            message: `Mapped fields were submitted to webhook.site`,
          }

        })

      } catch (error) {

        // In case something goes wrong while executing the Submit job, we fail the job with a message on what next steps to take
        await api.jobs.fail(jobId, {
          outcome: {
            message: "Submitting the data encountered an error. See event logs",
          }

        });

      }

    })

  })

}