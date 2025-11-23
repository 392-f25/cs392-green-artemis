import { render } from "@testing-library/react";
import type { AggregateStats } from "../../utils/types"
import { AggregateSummary } from "./AggregateSummary";

const as: AggregateStats = {
    averagePoints: 8.5,
    averageDistanceFromCenter: 15.2,
    missedShots: 3,
    averagePrecision: 12.8,
    shotCount: 25
}

test('AggregateSummary renders correct average points', () => {
    const { getByText } = render(
        <AggregateSummary
            roundCount={10}
            aggregateStats={as}
        />
    );
    expect(getByText('8.50')).toBeDefined();
});

test('AggregateSummary renders correct average distance from center', () => {
    const { getByText } = render(
        <AggregateSummary
            roundCount={10}
            aggregateStats={as}
        />
    );
    expect(getByText('15.2')).toBeDefined();
});

test('AggregateSummary renders correct missed shots', () => {
    const { getByText } = render(
        <AggregateSummary
            roundCount={10}
            aggregateStats={as}
        />
    );
    expect(getByText('3')).toBeDefined();
}); 

test('AggregateSummary renders correct average precision', () => {
    const { getByText } = render(
        <AggregateSummary
            roundCount={10}
            aggregateStats={as}
        />
    );
    expect(getByText('12.8')).toBeDefined();
});

