export default defineEventHandler((event) => {
	// Don't worry this doesn't have any use to you
	setCookie(event, 'session', 'Fe26.2**92803c65fff63072f05de71068e78fa17b6f12e056902e3f1f355607f6e641d2*RvRznupxS8FtYdhTVM7i4g*lKkEUWmBSbgxy6UFfGZzaFvQryP2H4cRKKJ6oB460avmZYVrNeCPaBopkFKLwow6yw7spLaY0tPifjo5chMUAWWhA6xalELxMuay4YOtv9CsZTfOm85iKEM8yrc6jOq-BcftM40btQK7OZe1PYozFzrAWlPzgXiuov8xeFtuc3V603Dh1iNBzGle9772XSqd1HzPTuvbz-2wAC_oZS8_KXn0NRp34RL9kEwP-FvYFjjIehaYlv7tblNQfkGfU1KjdI2WFj2c6MUSJ3XpM0IqOVW-uxrT_SJ6vUTV9blT037oqCl_1mdL9KjReuhUsJvd*1726094040694*bb87a9cd37e8194a3268153f342f84ce18ee30b761f2f5f56e4b9b6f382510a5*PaZliKOzk1DIr3xkUtx9nNnLQqQtIK4fr6bI_smUjlg')

	return sendRedirect(event, '/')
})
