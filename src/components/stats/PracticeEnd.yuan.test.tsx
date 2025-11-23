import { render } from "@testing-library/react"
import type { End } from "../../utils/types"
import { PracticeEnd } from "./PracticeEnd"

interface PracticeEndProps {
    roundId: string
    end: End
    endIndex: number
    isExpanded: boolean
    onToggle: () => void
  }

test('PracticeEnd renders correct total score', () => {
    const pe: PracticeEndProps = {
        roundId: "",
        end: {
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
        
        endIndex: 0,
        isExpanded: false,
        onToggle: () => {}
    };
    const { getByText } = render(
        <PracticeEnd
            roundId={pe.roundId}
            end={pe.end}
            endIndex={pe.endIndex}
            isExpanded={pe.isExpanded}
            onToggle={pe.onToggle}
        />
    );
    expect(getByText('10 pts')).toBeDefined();
});
