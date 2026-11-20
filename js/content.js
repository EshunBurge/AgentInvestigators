/* Agent Investigator — "The Red Light Conspiracy"
   Nine stations + HQ. Each station: briefing, three puzzles (mixed types), one piece of evidence.
   Puzzle types:  mc (one answer) · multi (select all) · sort (assign each item to a bucket) */
const MC = (q, options, answer, why) => ({ type:'mc', q, options, answer, why });
const MULTI = (q, options, answers, why) => ({ type:'multi', q, options, answers, why });
const SORT = (q, buckets, items, why) => ({ type:'sort', q, buckets, items:items.map(([t, b]) => ({ t, b })), why });

window.CASE = {
  title: "The Red Light Conspiracy",
  intro: "Last night every traffic light on Hollis Avenue turned green at once. Nobody was hurt, but the city's AI system filed a report blaming a delivery courier named Dana Voss. The mayor wants the truth by morning. Collect nine pieces of evidence across Nightfall City, then return to HQ and name the real cause.",
  stations: [
    { id:"basics", name:"The Pattern Room", x:0, z:-22, topic:"How AI works",
      brief:[
        "AI chatbots don't look things up the way a search engine does. They predict which words are likely to come next, based on patterns in huge amounts of text.",
        "That is why they sound confident even when they're wrong. A smooth, fluent answer is not proof that the answer is true.",
        "Detective rule #1: treat AI output as a lead, not a verdict."
      ],
      puzzles:[
        MC("The city's AI report says: \"The courier Dana Voss caused the signal failure.\" It sounds very certain. What does that certainty tell you?",
          ["The report is probably correct, because it sounds sure.","Nothing on its own. Confident wording is not evidence.","The report must be wrong, because AI is always wrong."],1,
          "AI can write confident sentences about things it got wrong, and it isn't always wrong either. Certainty of tone proves nothing, so you check the evidence behind the claim."),
        SORT("Sort each tool by how it works.", ["Follows exact rules or looks up records","Predicts likely patterns"],
          [["A spreadsheet formula",0],["A chatbot writing a paragraph",1],["Searching a library catalog by title",0],["Phone autocomplete suggesting your next word",1],["A calculator",0],["An AI image generator",1]],
          "Formulas, calculators and catalogs follow exact rules or retrieve stored records. Chatbots, autocomplete and image generators produce what is statistically likely, which is why they can be fluent and wrong."),
        MULTI("Which of these statements about AI chatbots are true? Select all that apply.",
          ["They can sound sure while being wrong.","A fluent answer is proof that it's accurate.","They learn patterns from huge amounts of example text.","They always know exactly where their information came from.","Important answers should be double-checked."],[0,2,4],
          "Chatbots learn patterns from text, can be confidently wrong, and usually can't point to where a specific claim came from. That is why anything important gets checked.")
      ],
      evidence:{ title:"Evidence #1 — The report has no sources", text:"The AI report accuses Dana Voss but lists no logs, camera footage, or witnesses. It is a claim, not a finding." } },

    { id:"prompting", name:"The Prompt Lab", x:-44, z:-22, topic:"Prompting",
      brief:[
        "Vague questions get vague answers. A strong prompt tells the AI four things: the task, the context, the constraints, and the format you want back.",
        "Example: instead of \"Tell me about the signal\", try \"Using the attached error log, list the three most likely causes of the 11:42 PM failure. Only use facts from the log. Answer as a numbered list.\"",
        "Better prompts give you answers that are easier to check."
      ],
      puzzles:[
        MC("You want the AI to help you analyze the signal log. Which prompt is strongest?",
          ["What happened to the lights?","Fix the traffic problem and make it good.","Here is the 11:42 PM signal log. List the three most likely causes, using only facts in the log, and mark anything you are unsure about."],2,
          "The third prompt names the task, gives the context (the log), sets a constraint (only facts in the log), and asks it to flag uncertainty, which makes the answer much easier to verify."),
        MULTI("Which are the four ingredients of a strong prompt? Select all that apply.",
          ["The task: what you want done","The context: what it needs to know","The constraints: limits and rules","The format: how you want the answer","Typing in ALL CAPS","Making it as short as possible"],[0,1,2,3],
          "Task, context, constraints and format. Capital letters and extreme shortness don't help; being specific does."),
        SORT("Is each prompt vague or specific?", ["Vague","Specific"],
          [["Make my essay better.",0],["Give feedback on my thesis in three bullet points, focused on clarity, for a 10th-grade English class.",1],["Tell me about history.",0],["List five causes of the Great Depression, one sentence each, most important first.",1]],
          "Specific prompts say who it's for, what to focus on, how long, and what shape the answer should take. Vague prompts leave the AI guessing.")
      ],
      evidence:{ title:"Evidence #2 — The error log", text:"Asked properly, the log shows all 14 signals received the same command at 11:42 PM from the central controller, not from anything Dana did." } },

    { id:"integrity", name:"The Integrity Office", x:-66, z:-44, topic:"Honest AI use",
      brief:[
        "Using AI for school or work is a choice about honesty. The rule of thumb: AI can help you learn, but the thinking and the final work should still be yours.",
        "Follow your teacher's or workplace's policy first. If the policy is unclear, ask. When you do use AI, say so: which tool, what you asked, and what you changed.",
        "Good uses: quizzing yourself, explaining a hard idea, feedback on your own draft. Bad uses: submitting AI writing as your own."
      ],
      puzzles:[
        MC("Your teacher hasn't said whether AI is allowed on a project. What should you do?",
          ["Use it quietly and hope it's fine.","Ask your teacher before using it.","Assume it's banned and never mention it."],1,
          "When a rule is unclear, ask. Guessing puts your grade and trust at risk, and asking shows good faith."),
        SORT("Assuming your class allows AI help, which uses are honest and which are cheating?", ["Honest use","Dishonest"],
          [["Asking AI to quiz you before a test",0],["Submitting an AI-written answer as your own",1],["Asking AI to explain a concept you don't understand",0],["Having AI write your reflection, then changing a few words",1],["Getting feedback on your own draft and noting that you did",0],["Using AI during a closed-book test",1]],
          "Honest use supports your own learning and is disclosed. Passing off AI work as yours, or using it where it's not allowed, is dishonest even if you tweak a few words."),
        MC("Which note is the best way to disclose AI help on an assignment?",
          ["\"I used some tools.\"","\"I used an AI chatbot to get feedback on my draft's structure. I rewrote the intro myself based on its suggestions.\"","Nothing. It's only a little bit of help."],1,
          "A good disclosure names the tool, what you asked it, and what you did with the result, so a reader knows exactly which parts are yours.")
      ],
      evidence:{ title:"Evidence #3 — The unsigned report", text:"Nobody can say who prompted the AI or what it was asked. No disclosure, no accountability trail." } },

    { id:"facts", name:"The Records Archive", x:-44, z:22, topic:"Checking claims",
      brief:[
        "AI sometimes invents things that look real: fake quotes, fake statistics, even fake sources. People call this a hallucination.",
        "A real source can be found by someone else. If you can't find the article, author, or link anywhere except in the AI's answer, don't trust it.",
        "Check important claims in at least two independent places before you rely on them."
      ],
      puzzles:[
        MC("The AI report cites \"Journal of Urban Signals, Vol. 88, 2031\" to support its claim. You search and find no such journal or issue. What should you do?",
          ["Trust it anyway. The citation looks professional.","Treat the claim as unverified and look for a real, checkable source.","Ask the same AI if it's sure, and accept its answer."],1,
          "A source you can't find may have been invented. Asking the same AI to vouch for itself isn't an independent check. Look for records, documents, or experts you can verify."),
        MULTI("Which of these are red flags that a source might be made up? Select all that apply.",
          ["You can't find the journal or author anywhere else.","The link opens a real page that says the same thing.","Very exact numbers with no source given.","A dramatic quote with no date or place.","Two independent, reliable sites report the same fact."],[0,2,3],
          "Missing authors, exact numbers without sources, and undated quotes are warning signs. A real page that matches, or independent agreement, are signs of a real source."),
        MC("An AI tells you a statistic about school lunches. What's the best way to check it?",
          ["Ask the AI to say it again more confidently.","Find the original report from a reliable organization and read the number there.","Check whether it sounds reasonable."],1,
          "Go to the original source. Rereading the AI's answer, or judging by gut feeling, isn't verification.")
      ],
      evidence:{ title:"Evidence #4 — The fake citation", text:"The report's \"supporting study\" does not exist. The AI made it up to sound convincing." } },

    { id:"deepfake", name:"The Deepfake Lab", x:-66, z:44, topic:"Fake images & video",
      brief:[
        "AI can now generate realistic images, voices and videos of events that never happened. They're called synthetic media, or deepfakes.",
        "Clues: strange hands or teeth, garbled text, odd shadows, a voice that doesn't match the lips. But clues fail as the tools improve, so the strongest check is the source.",
        "Ask: Who posted this first? Is there an original? Do trusted outlets confirm it? Be extra careful when a post makes you angry or scared; that is how fakes spread."
      ],
      puzzles:[
        MC("A viral clip shows the mayor \"admitting\" the signals were hacked. It has no source. What's your first move?",
          ["Share it so others can decide.","Trace where it came from and look for the original and trusted confirmation.","Trust it, because the voice sounds exactly like her."],1,
          "A voice or face can be faked. Tracing the original source and checking trusted outlets tells you far more than how real it looks."),
        MULTI("Which of these can be signs an image is AI-generated? Select all that apply.",
          ["Garbled text on signs or badges","Hands with the wrong number of fingers","Shadows that point in different directions","A caption that includes the photographer and location","The photo is in color"],[0,1,2],
          "Garbled text, odd hands and inconsistent shadows are classic signs. A credited photographer and place is a sign of provenance, and color tells you nothing."),
        SORT("Is each piece of evidence strong or weak for proving a photo is real?", ["Strong evidence","Weak evidence"],
          [["Posted by the city's official account along with the full video",0],["An anonymous repost with no source",1],["Matches the original photographer's upload",0],["\"It looks real to me\"",1],["100,000 people shared it",1],["Confirmed by several news outlets with original footage",0]],
          "Provenance and independent confirmation are strong. Gut feeling, popularity and anonymous reposts are weak.")
      ],
      evidence:{ title:"Evidence #5 — The doctored photo", text:"The \"photo\" the AI used to place Dana at the signal box is AI-generated: her badge number is garbled and the shadows point two ways." } },

    { id:"privacy", name:"The Vault", x:22, z:44, topic:"Privacy",
      brief:[
        "Anything you type into a public AI tool may be stored, reviewed, or used to improve the system. Treat it like writing on a postcard, not a sealed letter.",
        "Don't paste in private details: full names with addresses, passwords, ID numbers, medical info, or other people's personal information.",
        "You can usually still get help by removing or changing the identifying details first."
      ],
      puzzles:[
        MC("You want AI help summarizing Dana Voss's delivery records. Which is the safest way to ask?",
          ["Paste her full name, home address, and phone number so the summary is accurate.","Replace her details with \"Courier A\" and share only the delivery times.","Upload her entire personnel file, including her ID."],1,
          "Using a placeholder and sharing only what's needed keeps private information out of the tool, and you still get the help you wanted."),
        SORT("Is it okay to paste each item into a public AI tool?", ["OK to share","Keep private"],
          [["A made-up example email",0],["Your home address",1],["A general question about how engines work",0],["A classmate's grades",1],["A password or login code",1],["A paragraph of your own essay draft, with no personal info",0]],
          "Invented examples, general questions and your own non-sensitive work are fine. Addresses, other people's records and credentials stay private."),
        MULTI("Which are smart privacy habits when using AI? Select all that apply.",
          ["Use placeholders instead of real names.","Check the app's settings about how your chats are used.","Use the same password on every AI app.","Share only the details the task needs.","Assume deleted chats are erased instantly everywhere."],[0,1,3],
          "Placeholders, checking settings and sharing the minimum are good habits. Reusing passwords and assuming instant deletion are not.")
      ],
      evidence:{ title:"Evidence #6 — Dana's real timeline", text:"With details anonymized, the delivery times show Courier A was across town, 3 km from Hollis Avenue, at 11:42 PM." } },

    { id:"bias", name:"The Hiring Floor", x:66, z:44, topic:"Bias & fairness",
      brief:[
        "AI learns from past data. If that data reflects unfair patterns, the AI can copy them. This is called bias.",
        "Example: a system trained on who a company hired in the past may keep favoring the same kinds of people, even if it never sees their names.",
        "Fairness checks ask: who is represented in the data, who is missing, and who could be harmed by a mistake?"
      ],
      puzzles:[
        MC("The city's AI flags \"suspicious couriers\" and almost always picks people from one neighborhood. What is the best next step?",
          ["Keep using it. The computer has no opinions.","Audit the training data and results across neighborhoods, and have a person review the flags.","Add more flagged couriers from that neighborhood so it learns faster."],1,
          "Machines can inherit unfairness from data. Checking results across groups and keeping human review catches problems before they hurt people."),
        MULTI("Where can bias in an AI system come from? Select all that apply.",
          ["Training data that's missing some groups","Past decisions that were unfair","Which features the designers chose to measure","Computers can't be biased by definition"],[0,1,2],
          "Bias can enter through the data, the history behind it, and design choices. \"Computers are neutral\" is a myth."),
        MC("A face-unlock works well for some skin tones and often fails for others. What is the most likely cause?",
          ["The training photos didn't include enough variety.","Some people's faces are simply harder to recognize.","The phone is broken."],0,
          "When a system works unevenly across groups, the training data usually under-represented some of them. The fix is better data and testing.")
      ],
      evidence:{ title:"Evidence #7 — A biased shortcut", text:"The \"suspicious courier\" tool was trained on old complaints from one district, so it keeps pointing at couriers who work there. Dana's route is in that district." } },

    { id:"data", name:"The Data Wall", x:44, z:-22, topic:"Reading data",
      brief:[
        "When two things happen together, it's tempting to say one caused the other. That's called confusing correlation with causation.",
        "Ice cream sales and sunburns both rise in summer. Ice cream doesn't cause sunburn. Hot weather causes both.",
        "Before accepting \"A caused B\", ask: could something else explain both? Could it be a coincidence?"
      ],
      puzzles:[
        MC("The AI notes that signal failures happened on the same nights Dana made deliveries, so she caused them. What is the flaw?",
          ["Nothing. Same nights means she caused it.","It confuses correlation with causation. Something else, like a scheduled system update, could explain both.","Deliveries can never be related to traffic lights."],1,
          "Happening at the same time doesn't prove cause. A hidden factor, like a weekly update that runs late at night when couriers are also busiest, can explain both."),
        MC("A study finds students who sleep more tend to get higher grades. What can you fairly conclude?",
          ["Sleep alone definitely causes better grades.","The two are linked, but more evidence is needed to show cause.","Grades cause sleep."],1,
          "A link is a starting point. Other factors, such as stress or study habits, could be involved, so you'd need better evidence to claim cause."),
        MULTI("Which questions help you judge a chart or statistic? Select all that apply.",
          ["What do the axes show, and does the scale start at zero?","Who made it, and why?","How many data points does it use?","Is it colorful?"],[0,1,2],
          "Scale, source and sample size matter. Colors are decoration.")
      ],
      evidence:{ title:"Evidence #8 — The late-night update", text:"Every failure matches a scheduled software update to the signal controller, which runs at night. The courier correlation is a coincidence." } },

    { id:"human", name:"The Control Tower", x:66, z:-44, topic:"Human judgment",
      brief:[
        "AI is great at fast, repetitive work. People are needed for judgment, fairness, and responsibility, especially when a decision affects someone's safety, job, or reputation.",
        "A good rule: the higher the stakes, the more a human must review before anything happens.",
        "\"The AI did it\" is never a complete explanation. A person or organization is always accountable."
      ],
      puzzles:[
        MC("The AI recommends firing Dana immediately based on its report. Who should make this decision?",
          ["The AI, since it analyzed everything.","A person who reviews the evidence and is accountable for the outcome.","Nobody. Wait for the AI to decide on its own."],1,
          "High-stakes decisions about people need human review. The AI can assist, but a person must check the facts and take responsibility."),
        SORT("Who should make each decision?", ["AI can do it alone","A person must decide"],
          [["Sorting your playlist by mood",0],["Deciding whether a student is suspended",1],["Suggesting a spelling fix",0],["Approving a medical treatment",1],["Picking a font for a poster",0],["Deciding who gets a loan",1]],
          "Low-stakes, easily undone tasks suit AI. Decisions that affect safety, health, money or someone's record need a person who is accountable."),
        MC("After a mistake, a company says \"The AI did it.\" Who is actually accountable?",
          ["The AI itself.","The people and organization that chose to build, deploy and trust it.","Nobody. It was an accident."],1,
          "Software can't be held responsible. The people and organizations that deploy it are.")
      ],
      evidence:{ title:"Evidence #9 — Nobody checked", text:"The system sent its accusation straight to the mayor's office. No human reviewed it before it went out." } },

    { id:"hq", name:"Case Board (HQ)", x:0, z:0, topic:"The final answer", final:true,
      brief:[
        "You have all nine pieces of evidence. Time to name the real cause of the Hollis Avenue failure and the false accusation."
      ],
      puzzles:[
        MC("Based on your evidence, what really caused the signal failure and the false accusation?",
          ["Dana Voss tampered with the signals, exactly as the AI said.","A scheduled update sent a bad command to every signal. The AI then produced a confident, unsourced report that no human checked.","A hacker from another city did it, and the AI correctly found no one."],1,
          "The evidence points to a software update, plus an AI report with no sources, a fake citation, a doctored photo, biased data, and no human review. Dana was innocent."),
        MULTI("Which problems did you find in the city's AI report? Select all that apply.",
          ["No sources for its accusation","A citation that doesn't exist","A photo that was AI-generated","A biased tool pointing at one district","Careful human review before it was sent","It mistook correlation for cause"],[0,1,2,3,5],
          "Everything except human review: that is the one safeguard that was missing."),
        MC("Which new city rule would best prevent this from happening again?",
          ["Never use AI for anything.","Require sources and a named human reviewer before any AI report accuses a person.","Let the AI review its own reports."],1,
          "Keep the speed of AI but add the safeguards you found missing: checkable sources and an accountable human.")
      ],
      evidence:{ title:"Case closed", text:"The city agrees to review every AI report with a human before acting on it." } }
  ],
  ranks:[ [0,"Recruit"], [.4,"Field Agent"], [.65,"Senior Agent"], [.85,"Master Investigator"] ]
};
