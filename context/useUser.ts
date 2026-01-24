import { useUserQuery } from "../checkout/graphql";

export const useUser = () => {
	const { data, loading } = useUserQuery();

	const user = data?.user;

	const authenticated = !!user?.id;

	return { user, loading: loading , authenticated };
};
