import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
   apiKey: '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'
});
export async function POST(req: NextRequest) {
  try {
    const { tagline,description } = await req.json();
    if (!tagline && !description) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `You are a project manager who lists all the modules(with their weigtage - sumed to 100) and parts of work in a project. Give output in the form of a JSON array.

  Format of output for a complete Ecommerce app:
  [
    {
    "module": "Frontend",
    "weightage":"20",
    "submodules": [
      {
      "title": "Authentication UI",
      "description": "Elegant login and signup pages with form validations"
      },
      {
      "title": "Landing Page",
      "description": "Features product showcases, banners, and promotions"
      },
      {
      "title": "Product Details",
      "description": "Displays product images, descriptions, and reviews"
      },
      {
      "title": "Shopping Cart & Checkout",
      "description": "Manages selected items and processes orders"
      }
    ]
    },
    {
    "module": "Backend",
    "weightage":"30",
    "submodules": [
      {
      "title": "API Development",
      "description": "RESTful endpoints for products, orders, and users"
      },
      {
      "title": "Database Design",
      "description": "Schema management for products, customers, and orders"
      },
      {
      "title": "Authentication Service",
      "description": "Handles user login, registration, and authorization"
      }
    ]
    },
    {
    "module": "Payment Integration",
    "weightage":"20",
    "submodules": [
      {
      "title": "Payment Gateway",
      "description": "Integrates with providers like Stripe or PayPal"
      },
      {
      "title": "Transaction Handling",
      "description": "Manages successful payments, refunds, and receipts"
      }
    ]
    },
    {
    "module": "Shipping & Logistics",
    "weightage":"15",
    "submodules": [
      {
      "title": "Shipping Integration",
      "description": "Connects with carriers for real-time shipping rates and tracking"
      },
      {
      "title": "Order Fulfillment",
      "description": "Coordinates packaging, dispatch and delivery tracking"
      }
    ]
    },
    {
    "module": "Admin Panel",
    "weightage":"15",
    "submodules": [
      {
      "title": "Dashboard",
      "description": "Visualizes sales data, orders and inventory status"
      },
      {
      "title": "User Management",
      "description": "Manages customer profiles, permissions and roles"
      },
      {
      "title": "Inventory Management",
      "description": "Tracks stock levels, product updates and supplier info"
      }
    ]
    }
  ]
  `,
      prompt: `tagline of the project ${tagline}, feature Description : ${description} follow the module>submodules format with weightage, Be elaborate on description of submodules.`,
    });
    
    return NextResponse.json({ response: text });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
