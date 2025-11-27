"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ReportsTab() {
    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Reports visualization coming soon.</p>
            </CardContent>
        </Card>
    )
}
