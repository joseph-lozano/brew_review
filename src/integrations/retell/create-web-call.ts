import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const createWebCallSchema = z.object({
  orderId: z.number(),
  customerName: z.string(),
  productNames: z.array(z.string()),
  orderDate: z.string(),
});

export type CreateWebCallInput = z.infer<typeof createWebCallSchema>;

interface RetellWebCallResponse {
  call_id: string;
  call_type: string;
  call_status: string;
  agent_id: string;
  access_token: string;
}

export const createWebCall = createServerFn({ method: "POST" })
  .inputValidator(createWebCallSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.RETELL_API_KEY;
    const agentId = process.env.RETELL_AGENT_ID;

    if (!apiKey) {
      throw new Error("RETELL_API_KEY environment variable is not set");
    }

    if (!agentId) {
      throw new Error("RETELL_AGENT_ID environment variable is not set");
    }

    const response = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        metadata: {
          order_id: data.orderId.toString(),
        },
        retell_llm_dynamic_variables: {
          customer_name: data.customerName,
          product_names: data.productNames.join(", "),
          order_date: data.orderDate,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create web call: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as RetellWebCallResponse;

    return {
      callId: result.call_id,
      accessToken: result.access_token,
    };
  });
