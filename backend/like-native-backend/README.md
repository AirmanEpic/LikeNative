# Like Native

## What is Like Native?

Like Native is the world's first (I think!) open source reddit-based translation app! 

Like Native came about as an attempt to learn German as soon as humanly possible. The intent was originally to translate every page on the internet in to the target language, but that was eventually scaled back a wee bit in order to make life a little easier. Now, it targets basically reddit only. This exposes the user to a lot of their language while not making it unbearable. 

## How it works:

After installing the extension and the app, all titles in your "old reddit" are translated into your target language. This immerses you in your target language. However, if you need help with a specific word, you can select "Unmask" on that word to expose its English translation. This action sends that specific word to a database. If you'd like to set some time aside to practice your vocabulary in that language, you can go to "Practice" in the app's UI. You then have an Anki-like interface to study cards. The app has several difficulty algorithms that have different varieties of spaced repetion algorithms. Some of which work better than others. My favorite is "Refresher" but you should use "Mix" to start off. 

If you ever want to see how well you really know the language, use the test mode. You'll have a short period to recall the word. If you get it right, you'll never need to worry about it in the test mode. You can practice for the test's difficulty algorithm explicitly in practice mode. 

## does it work?
I have no scientific data to back this, other than spaced repetition being the current highest tech memorization technique, and immersion being a good strategy. That being said, I feel like it's helping me learn.

## limitations:
- We only support languages with 1 writing scheme. Japanese with its multiple written language types will not work unless you're happy with 1.
- We only support languages with words delimited with spaces.
- So far, only support for old.reddit.com
- cumbersome installation process
- non-competive pricing once you get out of google's free trial

# Installing/developing using Like Native

## wait what? This is all so technical! How do we use this if we're not developers?

I'm so sorry lol. If you're not a developer, this isn't going to be fun. 

Why? 

I've used the app for about a month. At the time of writing this, I've accumulated ~$12 in google translate API fees. There are 10,000 rows in my translation database.
At the moment, I don't need to pay for AWS fees, but shuttling this data to and from amazon's servers will be slow and expensive. There's no way to do the translation system locally, which means we'll be using google's services, and running our system locally would be difficult. Thus, we would have to charge upwards of $15 a month just to get even on translation and AWS costs, not including the database maintenance. Honestly, for that much, there are better services around.

Thus, the only option left is the online/local hybrid setup we have here. You can rely on google's good graces for the first few months, after which you'll have accumulated enough translations that you may not have to pay for much anymore. After that, you'll be paying 5-10 dollars to google a month, which isn't unbearable IMHO. 

There still may be a way to do the setup automatically, which I'd be interested to learn about. See the "PRs needed" section. 

in summary: Database prices and computation prices make hosting too expensive, APIs make locally hosting for free impossible. 

## PRs needed

So I originally developed this for myself, and so do most of the development myself, but if you're interested in making a PR or two, I have a few open things I wouldn't mind help with:

- catching and removing any stray API keys found in the app. I tried to catch them all but I'm only human.
- bugfixes (obviously)
- testing and implementing compatibility with new.reddit.com
- a way to temporarily disable the plugin without having to remove it.
- fixing mistakes or simplifications in this readme
- a simplified installation process/script
- better/different difficulty algorithms
- better/different practice methods
- support for native languages other than English (this shouldn't be as hard as you might think)
- inexpensive alternatives to google, and implementations thereof
- some kind of AI LLM, preferably local installation but if not, something that only uses its LLM powers when practicing.

## the actual installation process:
Brace yourself. 

### Prerequisites: 
- NodeJS and NPM. Optionally, NVM.
- Python (for AWS's API) and Pip
- Postgres and PGAdmin

### get your AWS key ID and secret access key:
at the moment of recording, AWS in all its eternal wisdom has blessed us with a relatively easy way to get this:
- create an AWS account
- log into said account
- find IAM
- create a user for SST
- give that user admin access (everything!)
- on that user's page, scroll down a little to the security credentials selection
- create a new credential for AWS Programmatic access.
- save the API access key ID and API secret key.
- if you value your life, create a budget for $5. if it goes over $5 something has gone very wrong. 

### install the AWS CLI
This will be what you use to run your development environment using SST - it's really complicated and annoying but necessary. Believe me this is better than the alternative. And you only need to do it once.
follow this instruction set here: https://sst.dev/chapters/configure-the-aws-cli.html

Run aws configure to save your keys.

### Postgres config
Create a database in postgres with a memorable name. I chose LikeNative. Create and remember your database address as this will be useful later.
my database URL was: postgresql://postgres:< my DB Password >@localhost:5432/likeNative

### install all our packages
You'll need this for our app to do its thing. If you don't it won't work.
- in your terminal, use CD to nagivate through your folders to the file you need
- use "ls" to list off the subfiles/folders where you are to help with this
- get to the backend folder. It should have a file called "package.json" in it
- in this folder, you run ``npm install .`` and stuff should happen. If errors happen, google them!
- created a file called ``.env`` in that folder
Sample .env
```
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/likeNative"
URL = "http://localhost:3000"
TRANSLATION_API_KEY = 
TRANSLATION_PROJECT_ID = 
LANGUAGE = "de"
```
the api key and project ID will come later. 

### Prisma
run ``npx prisma db push``
this will initialize your DB. 

then run ``npx prisma migrate dev``
this will sync your db's migrations. 

### getting a Google API key
I'm so sorry, I don't remember how to do this. You need to create a project, then record the project ID. When that's done, get the API key, enable it, and record the key.
that goes in the .env.

### Running the app
When all that's done, you'll need to simulate provisioning the app on your computer, which you do with

``npx sst dev``

When your app finishes its init procedure, then you can quit that process and run

``npm run dev``

this will start the app. 

Go to whatever address it gives you to verify it's running.

### installing the browser addon and seeing your first translations

This is only tested in firefox, so go to the following URL in firefox: ``about:debugging#/runtime/this-firefox``

find "load temporary add-on" and navigate to the manifest.json located in /likeNative/plugin

this will install and initialize the plugin.

Go to old.reddit.com, and you should see the titles change from their native language (English usually) to "Translating..." to your target language. As this happens, you should see API requests going through and being approved on the console window running Next.