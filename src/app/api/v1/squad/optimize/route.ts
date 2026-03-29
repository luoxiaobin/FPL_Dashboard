import { NextResponse } from 'next/server';

export async function POST() {
  // Mock response for transfer optimization suggestions
  return NextResponse.json({
    suggestions: [
      { out_id: 114, in_id: 205, expected_gain: 4.5, out_name: "Nakamba", in_name: "Barnes" },
      { out_id: 115, in_id: 301, expected_gain: 2.1, out_name: "Lascelles", in_name: "Branthwaite" }
    ]
  });
}
