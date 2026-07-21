import type { ContributionGridData, ContributionLevel } from "../types/contribution";

type GitHubContributionDay = {
  contributionCount: number;
  date: string;
};

type GitHubContributionWeek = {
  contributionDays: GitHubContributionDay[];
};

type GitHubContributionResponse = {
  data?: {
    user?: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: GitHubContributionWeek[];
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
};

type FetchContributionGridOptions = {
  username: string;
  token: string;
  rows: number;
  columns: number;
};

const query = `
  query ContributionPet($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

const countToLevel = (count: number): ContributionLevel => {
  if (count <= 0) {
    return 0;
  }

  if (count <= 2) {
    return 1;
  }

  if (count <= 5) {
    return 2;
  }

  if (count <= 10) {
    return 3;
  }

  return 4;
};

export const fetchContributionGrid = async ({
  username,
  token,
  rows,
  columns,
}: FetchContributionGridOptions): Promise<ContributionGridData> => {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "mowmow",
    },
    body: JSON.stringify({
      query,
      variables: {
        login: username,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status}`);
  }

  const payload = (await response.json()) as GitHubContributionResponse;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  const weeks =
    payload.data?.user?.contributionsCollection.contributionCalendar.weeks;

  if (!weeks) {
    throw new Error(`GitHub user not found: ${username}`);
  }

  const days = weeks
    .flatMap((week) => week.contributionDays)
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(-(rows * columns));
  const paddedDays = [
    ...Array.from({ length: Math.max(0, rows * columns - days.length) }, () => ({
      contributionCount: 0,
      date: "",
    })),
    ...days,
  ];

  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, colIndex) => {
      const index = rowIndex * columns + colIndex;
      return countToLevel(paddedDays[index].contributionCount);
    }),
  );
};
