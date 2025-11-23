
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

test('Total Practice Score is summed correctly', async () => {
    const pcp: PracticeCardProps = {
        round: {
            id: "",
            createdAt: "",
            ends: [],
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