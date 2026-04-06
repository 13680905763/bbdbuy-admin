/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState: { currentUser?: any } | undefined
) {
  const { currentUser } = initialState ?? {};
  return {
    // canAdmin: currentUser && currentUser.access === 'admin',
    canAdmin: "admin",
  };
}
