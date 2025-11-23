
import type { Round } from "../../utils/types";
import { PracticeCard } from "./PracticeCard";
import { render } from "@testing-library/react";

interface PracticeCardProps {
    round: Round
    practiceNumber: number
    formattedDate: string
    onRequestDelete: (roundId: string) => void
    onSaveNotes: (roundId: string, notes: string) => Promise<void>
    isDeleting: boolean
    isDeletePending: boolean
}

const pcp: PracticeCardProps = {
    round: {
        id: "",
        createdAt: "",
        ends: [
            {
                shots: [
                    {
                        x: 0,
                        y: 0,
                        score: 10
                    }
                ],
                endScore: 10,
                precision: 10
            },
            {
                shots: [
                    {
                        x: 0,
                        y: 0,
                        score: 2
                    }
                ],
                endScore: 2,
                precision: 0.2
            }
        ],
        totalScore: 73,
        notes: ""
    },
    practiceNumber: 1,
    formattedDate: "",
    onRequestDelete: (_: string) => { },
    onSaveNotes: async (_roundId: string, _notes: string) => { },
    isDeleting: false,
    isDeletePending: false
}

test('Total Practice Score is summed correctly', () => {

    const { getByText } = render(
        <PracticeCard
            round={pcp.round}
            practiceNumber={pcp.practiceNumber}
            formattedDate={pcp.formattedDate}
            onRequestDelete={pcp.onRequestDelete}
            onSaveNotes={pcp.onSaveNotes}
            isDeleting={pcp.isDeleting}
            isDeletePending={pcp.isDeletePending}
        />
    )

    expect(getByText('Total Score: 73')).toBeDefined();
});
