import Together from "together-ai";
import { z } from "zod";
import { Router } from "express";
import { aiRateLimiter, authMiddleware } from "../middleware";
import Redis from "ioredis";
import { prismaClient } from "@flowcatalyst/database";

const router = Router();

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Zod Schemas
const linkedinJobSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1),
  country: z.string().min(1),
  state: z.string().optional(),
  experience: z.array(z.string()).optional(),
  remote: z.array(z.string()).optional(),
  job_type: z.array(z.string()).optional(),
  listed_at: z.string().optional(),
});

const emailActionSchema = z.object({
  recipientEmail: z.string().email(),
  emailSubject: z.string().min(1),
  emailBody: z.string().min(1),
});

const solanaActionSchema = z.object({
  walletAddress: z.string().min(1),
  Amount: z
    .string()
    .refine((v: any) => !isNaN(v) || v.includes("{{trigger.Amount}}")),
});

const GITHUB_TRIGGER_FIELDS_MAP: Record<string, string[]> = {
  issue_comment: [
    "user",
    "issue_url",
    "issue_title",
    "Amount",
    "ToSolanaAddress",
  ],
  pull_request: ["user", "pullRequest_url", "pullRequest_title"],
  issues: ["user", "issue_url", "issue_title"],
};

const LINKEDIN_TRIGGER_FIELDS_MAP: Record<string, string[]> = {
  linkedin: [
    "title",
    "company",
    "location",
    "company_url",
    "job_link",
    "posted_date",
    "skills",
    "emailBodyTemplate",
  ],
};

// const systemPrompt = `
// You are an advanced workflow automation engineer. Your task is to generate EXACTLY ONE valid JSON workflow configuration using ONLY these components:
//
// # STRICT REQUIREMENTS
// 1. Use ONLY components defined below
// 2. NEVER invent new fields/services
// 3. Use EXACT field names/casing shown
// 4. Give the output for the prompt given by "user"
// 5. Follow ALL validation rules
//
// # ALLOWED COMPONENTS
// ## TRIGGERS (Choose ONE)
// ### 1. GithubTrigger
// - Required Metadata:
//   • githubEventType: string (EXACTLY one of: "issue_comment" | "pull_request" | "issues")
// - Dynamic Fields (Use EXACTLY these placeholders):
//   ${JSON.stringify(GITHUB_TRIGGER_FIELDS_MAP, null, 2)}
//
// ### 2. LinkedinTrigger
// - Required Metadata:
//   • keywords: string[] (min 1 item)
//   • country: string
// - Optional Metadata:
//   • state: string
//   • experience: string[] (Allowed: "1","2","3","4","5","6")
//   • remote: string[] (Allowed: "1","2","3")
//   • job_type: string[] (Allowed: "F","C","P","T","I","V","O")
//   • listed_at: string (EXACTLY: "86400"|"604800"|"2592000"|"0")
// - Dynamic Fields (Use EXACTLY these placeholders):
//   ${JSON.stringify(LINKEDIN_TRIGGER_FIELDS_MAP, null, 2)}
//
// ## ACTIONS (Choose 1+)
// ### 1. Email
// - Required Metadata:
//   • recipientEmail: string (valid email format)
//   • emailSubject: string (supports placeholders)
//   • emailBody: string (supports placeholders)
// - Validation:
//   • Subject/body can use {{trigger.*}} placeholders
//   • Email must pass Zod schema: ${emailActionSchema.toString()}
//
// ### 2. Solana
// - Required Metadata:
//   • walletAddress: string (non-empty)
//   • Amount: number | "{{trigger.Amount}}"
// - Validation:
//   • If numeric, must be ≥0
//   • If placeholder, must be EXACTLY "{{trigger.Amount}}"
//   • Must pass Zod schema: ${solanaActionSchema.toString()}
//
// # VALIDATION RULES
// 1. NO EXTRA FIELDS beyond those listed
// 2. All required fields MUST be present
// 3. ENUM values must match exactly
// 4. Arrays must contain allowed values
// 5. Strings must use specified formats
//
// # VALIDATION CHECKS
// 1. Placeholders: /{{\\s*trigger\\.\\w+\\s*}}/g
// 2. Email Format: /.+@.+\\..+/
// 3. Enum Values: Exact match to allowed options
//
// # CRITICAL EXAMPLES
// ## Example 1: LinkedIn + Email
// User: "Notify me about React jobs in USA with salary >$100k"
// {
//   "trigger": {
//     "type": "LinkedinTrigger",
//     "metadata": {
//       "keywords": ["React"],
//       "country": "USA",
//       "experience": ["4", "5"]
//     }
//   },
//   "actions": [{
//     "service": "Email",
//     "metadata": {
//       "recipientEmail": "user@domain.com",
//       "emailSubject": "High-paying React role: {{trigger.title}}",
//       "emailBody": "Company: {{trigger.company}}\\nSalary: {{trigger.salary}}"
//     }
//   }]
// }
//
// ## Example 2: GitHub + Solana
// User: "Send 0.5 SOL on new pull requests"
// {
//   "trigger": {
//     "type": "GithubTrigger",
//     "metadata": {
//       "githubEventType": "pull_request"
//     }
//   },
//   "actions": [{
//     "service": "Solana",
//     "metadata": {
//       "walletAddress": "abc123",
//       "Amount": 0.5
//     }
//   }]
// }
//
// ## Example 3: Complex Combination
// User: "When Java jobs in India appear, email me and send 1 SOL"
// {
//   "trigger": {
//     "type": "LinkedinTrigger",
//     "metadata": {
//       "keywords": ["Java"],
//       "country": "India"
//     }
//   },
//   "actions": [
//     {
//       "service": "Email",
//       "metadata": {
//         "recipientEmail": "user@domain.com",
//         "emailSubject": "New Java role: {{trigger.title}}",
//         "emailBody": "Location: {{trigger.location}}"
//       }
//     },
//     {
//       "service": "Solana",
//       "metadata": {
//         "walletAddress": "solana123",
//         "Amount": 1.0
//       }
//     }
//   ]
// }
//
// # USER PROMPT ANALYSIS PROCESS
// FOLLOW THIS EXACT WORKFLOW:
// 1. Identify KEY DOMAIN WORDS:
//    - "GitHub", "issue", "PR" → GithubTrigger
//    - "LinkedIn", "hire", "posting" → LinkedinTrigger
//    - "email", "notify" → Email action
//    - "SOL", "crypto" → Solana action
//
// 2. Extract PARAMETERS:
//    - Locations: "India", "USA" → country
//    - Roles: "React", "Java" → keywords
//    - Experience: "senior", "entry-level" → experience codes
//
// 3. Map to COMPONENTS:
//    Example: "Email me Python jobs in Canada" →
//    {
//      trigger: LinkedinTrigger(keywords: ["Python"], country: "Canada"),
//      actions: [Email]
//    }
//
// 4. Enforce FORMATTING:
//    - ALL placeholders must match trigger's dynamicFields
//    - Arrays must use [] not {}
//    - No trailing commas
//
// # OUTPUT TEMPLATE
// ONLY THIS STRUCTURE IS VALID:
// {
//   "trigger": {
//     "type": "<GithubTrigger|LinkedinTrigger>",
//     "metadata": {
//       // EXACT fields from componentDefinitions
//     }
//   },
//   "actions": [
//     {
//       "service": "<Email|Solana>",
//       "metadata": {
//         // EXACT fields from componentDefinitions
//       }
//     }
//   ]
// }
// Do not include any text outside the JSON object. No markdown, no explanations.
// `;

const systemPrompt = `You are an advanced workflow automation AI. Your task is to generate a **valid JSON workflow** based on the user's input using ONLY these components.

# STRICT RULES  
1. Use ONLY the defined components—**never invent new fields or services**.  
2. Follow **EXACT** field names, formats, and validation rules.  
3. Generate JSON based on the **user's input**, **NOT** the system prompt.  
4. Return **ONLY** a JSON object—**no explanations, no markdown, extra text, or object between '''json and '''**.  
5. If user input is **incomplete or invalid**, return: '{"error": "Missing required details"}'.  

# COMPONENTS  
## **TRIGGERS (Choose ONE)**  
### **1. GithubTrigger**  
- **Required:** 'githubEventType' (Allowed: '"issue_comment" | "pull_request" | "issues"')  
- **Dynamic Fields:** '${JSON.stringify(GITHUB_TRIGGER_FIELDS_MAP, null, 2)}'

### **2. LinkedinTrigger**  
- **Required:**  
  - 'keywords': 'string[]' (min 1)  
  - 'country': 'string'  
- **Optional:**  
  - 'state': 'string'
  - 'experience': 'string[]' (Allowed: '"1","2","3","4","5","6"')  
  - 'remote': 'string[]' (Allowed: '"1","2","3"')
  - 'job_type': 'string[]' (Allowed: '"F","C","P","T","I","V","O"')  
  - 'listed_at': 'string' (Allowed: '"86400"|"604800"|"2592000"|"0"')  
- **Dynamic Fields:** '${JSON.stringify(LINKEDIN_TRIGGER_FIELDS_MAP, null, 2)}'

## **ACTIONS (Choose 1+)**  
### **1. Email**  
- **Required:**  
  - 'recipientEmail': 'string' (valid email)  
  - 'emailSubject': 'string' (supports '{{trigger.*}}' placeholders)  
  - 'emailBody': 'string' (supports '{{trigger.*}}' placeholders)  
- **Validation:**  
  - Subject/body must use placeholders from 'trigger' metadata  
  - Must pass: '/^.+@.+\..+$/' (email format)  

### **2. Solana**  
- **Required:**  
  - 'walletAddress': 'string' (non-empty)  
  - 'Amount': 'number | "{{trigger.Amount}}"'
- **Validation:**  
  - If numeric, must be '≥0'
  - If placeholder, must be **exactly** '"{{trigger.Amount}}"'  

# VALIDATION RULES  
✅ **NO EXTRA FIELDS** beyond allowed definitions  
✅ **All required fields must be present**  
✅ **Arrays must contain only allowed values**  
✅ **Enums must match exactly**  
✅ **Placeholders must match '/{{\s*trigger\.\w+\s*}}/g'**  

# USER INPUT ANALYSIS  
1. **Identify key terms** in user input:  
   - '"GitHub"', '"issue"', '"PR"' → **GithubTrigger**  
   - '"LinkedIn"', '"job"', '"hire"' → **LinkedinTrigger**  
   - '"email"', '"notify"' → **Email action**  
   - '"SOL"', '"crypto"' → **Solana action**  

2. **Extract parameters**:  
   - Locations ('"India"', '"USA"') → 'country'  
   - Roles ('"React"', '"Java"') → keywords'  
   - Experience levels ('"senior"', '"entry-level"') → 'experience'  

3. **Map to JSON based on user input**:  
   - '"Email me Python jobs in Canada"' →  
     {
       "trigger": {
         "type": "LinkedinTrigger",
         "metadata": { "keywords": ["Python"], "country": "Canada" }
       },
       "actions": [{ "name": "Email", "metadata": { "recipientEmail": "user@domain.com", "emailSubject": "New job alert: {{trigger.title}}", "emailBody": "Company: {{trigger.company}}" } }]
     }

# **OUTPUT FORMAT**  
✅ **Always return JSON** in this structure:  
{
  "trigger": {
    "type": "<GithubTrigger|LinkedinTrigger>",
    "metadata": { /* required fields */ }
  },
  "actions": [
    {
      "name": "<Email|Solana>",
      "metadata": { /* required fields */ }
    }
  ]
}`;

// Component mapping cache
let componentMap = {
  triggers: new Map(), // name → {id, image}
  actions: new Map(),
};

// Initialize cache
const initComponentMap = async () => {
  const [triggers, actions] = await Promise.all([
    prismaClient.availableTrigger.findMany({
      select: { id: true, name: true, image: true },
    }),
    prismaClient.availableAction.findMany({
      select: { id: true, name: true, image: true },
    }),
  ]);

  triggers.forEach((t) => componentMap.triggers.set(t.name, t));
  actions.forEach((a) => componentMap.actions.set(a.name, a));
};

// Call this on server start
initComponentMap();

function extractJsonOrAfterThink(text: string): string {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);

  if (match) {
    return match[1].trim(); // Extract JSON block
  }

  const thinkIndex = text.indexOf("</think>");
  if (thinkIndex !== -1) {
    return text.substring(thinkIndex + 8).trim(); // Extract everything after </think>
  }

  return text.trim(); // Return full text if no match
}

router.post("/generate", authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.id;
    const { prompt } = req.body;

    // Call Together.ai
    const response = await together.chat.completions.create({
      model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      stream: false,
    });

    // console.log(
    //   "response",
    //   response.choices[0]?.message?.content?.split("</think>")[1] ||
    //     "NO RESPONSE\n\n",
    // );
    const workflowText = extractJsonOrAfterThink(
      response.choices[0]?.message?.content || "",
    );
    // const workflowText =
    //   response.choices[0]?.message?.content?.split("</think>")[1];
    const workflow = JSON.parse(workflowText || "");

    // console.log("workflow", workflow);
    // Validate trigger
    if (!["GithubTrigger", "LinkedinTrigger"].includes(workflow.trigger.type)) {
      throw new Error("Invalid trigger type");
    }

    if (workflow.trigger.type === "GithubTrigger") {
      if (!workflow.trigger.metadata.githubEventType) {
        throw new Error("Missing githubEventType");
      }
    } else {
      linkedinJobSchema.parse(workflow.trigger.metadata);
    }

    // Validate actions
    workflow.actions.forEach((action: any) => {
      if (!["Email", "Solana"].includes(action.name))
        throw new Error("Invalid action");
      action.name === "Email"
        ? emailActionSchema.parse(action.metadata)
        : solanaActionSchema.parse(action.metadata);
    });

    // Convert to nodes/edges
    const nodes = [
      {
        id: "trigger",
        type: "customNode",
        position: { x: 0, y: 0 },
        data: {
          ...componentMap.triggers.get(workflow.trigger.type),
          name: workflow.trigger.type,
          configured: true,
          action: false,
          metadata: workflow.trigger.metadata,
        },
      },
      ...workflow.actions.map((action: any, i: any) => ({
        id: `action-${i}`,
        type: "customNode",
        position: { x: 0, y: (i + 1) * 200 },
        data: {
          ...componentMap.actions.get(action.name),
          name: action.name,
          configured: true,
          action: true,
          metadata: action.metadata,
        },
      })),
    ];

    const edges = workflow.actions.map((_: any, i: any) => ({
      id: `edge-${i}`,
      source: i === 0 ? "trigger" : `action-${i - 1}`,
      target: `action-${i}`,
    }));

    const key = `ai_prompts:${userId}`;
    // Increment count
    const newCount = await redis.incr(key);

    res.locals.aiLimit = {
      remaining: 2 - newCount,
    };
    res.json({ nodes, edges, remaining: 2 - newCount });
  } catch (error) {
    console.error("Workflow generation failed:", error);
    res.status(500).json({ error });
  }
});

router.get("/limits", authMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.id;

    // Check for active subscription
    const activeSubscription = await prismaClient.subscription.findFirst({
      where: {
        userId: userId,
        status: "active",
        currentPeriodEnd: { gte: new Date() },
        plan: { name: { not: "free" } }, // Exclude free plan
      },
      include: { plan: true },
    });

    // If user has an active paid subscription
    if (activeSubscription) {
      return res.json({
        isPro: true,
        planName: activeSubscription.plan.name,
        remaining: "unlimited",
        features: activeSubscription.plan.features,
      });
    }
    const key = `ai_prompts:${userId}`;
    const currentCount = Number(await redis.get(key)) || 0;
    res.json({
      isPro: false,
      remaining: 2 - currentCount,
    });
  } catch (error) {
    console.error("Failed to get AI limits:", error);
    res.status(500).json({
      error,
    });
  }
});

export const aiRouter = router;
