useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Fetching current user...");
        
        const res = await fetch(
          'https://node-chai-production.up.railway.app/api/v1/user/current-user',
          {
            method: 'GET',
            credentials: 'include',
          }
        )

        console.log("Response status:", res.status);
        
        const data = await res.json()
        console.log("Response data:", data);

        if (!res.ok) throw new Error(data.message)

        const user = data.data

        dispatch(setCredentials({
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            fullname: user.fullname,
          },
          accessToken: null,
        }))

        navigate('/', { replace: true })

      } catch (error) {
        console.error("Google callback error:", error)
        navigate('/login', { replace: true })
      }
    }

    fetchUser()
  }, [])