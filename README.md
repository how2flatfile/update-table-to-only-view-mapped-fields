# Getting Started

## First things FIRST
If you find any issues with this README, or the repo in general, please email me at `how2flatfile@gmail.com`, or make a PR. I do what I can to keep everything in order, but I am human, after all 🙂

## For visual learners

If you want to just follow the video on how to get everything done, [here is a Loom video](https://www.loom.com/share/9c907f903b074bca8262bdff4dcf7b97?sid=52292f9a-dc83-4abc-ab16-826a0c3f7943) for you

**IMPORTANT -** If you follow the video above to get everything set up, the information below ***is still valuable to you***

I recommend you read through it


## Step-by-step instructions

*The instructions below are intentionally very detailed and descriptive to help any developer, regardless of their skill level*


### Basics
- [Click this link](https://github.com/how2flatfile/submit-mapped-fields) to access the repository

- Make sure that you are looking at the branch called `main`  

- Click on the green button that says `<> Code`, and copy the URL  

- Open your IDE, and clone the repository using the URL you just copied  

- Save the project on your computer (I prefer to save on the Desktop while I test)  

_________________________________________________
### Code Setup (valuable information for anyone)
- Open the project that you just saved on your computer. Open `index.ts` file

- Open the terminal, and run the command `npm install`

- Run `npm outdated`. If any Flatfile-related packages are not on the latest, update them to be on the latest
  - If you do update to the latest, after you do so, run `npm outdated` again to ensure update completed

- On line 7, replace existing link inside `webhookReceiver` with your unique URL
  - Go to https://webhook.site/ , and copy `Your unique URL` from there

- Run `npx flatfile@latest deploy`. For authentication, I prefer to select `API Key`
  - If you also select `API Key`, copy your `Secret Key` from your Flatfile dashboard

- Click enter, and confirm that terminal says `Event listener deployed and running ...`

_________________________________________________
### Test the workflow
- Login to your dashboard at `https://platform.flatfile.com/dashboard/`

- On the left panel next to `PLATFORM APPS`, click `+`

- For `Name`, type `App One`. Edit auto-generated `Namespace` to `appOne` to match what's in the code

- Click `Create New App` button. Then, select `App One` in the left panel

- On the top-right, click `+ Create New Space`

- Name your session `Submit mapped fields only`, and click `Enter` to create a new Space

- That Space should automatically open in a new tab. If it does not, click on Space name to open it 

- Click `Add file`, and upload `example_file.csv` that is inside the project you cloned

- Ensure that fields with `(DO NOT MAP)` in their name are NOT mapped. Make sure remaining fields are mapped

- Click `Continue`. As records load in the table, note that fields with `(DO NOT MAP)` in their names are empty

- Click `Submit` on the top right. When you see the `Success!` message, proceed to https://webhook.site/ 

- Notice how `(DO NOT MAP)` fields were NOT sent to https://webhook.site/ , since you left them unmapped