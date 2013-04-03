module.exports = {
	origins: [],                       // implicit same as ['*'], and null
	methods: ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'],  // OPTIONS is always allowed
	headers: [                        // both `Exposed` and `Allowed` headers
		'X-Requested-With', 
		'X-HTTP-Method-Override', 
		'Content-Type', 
		'Accept'
	], 
	credentials: false,                // don't allow Credentials
	resources: [
		{
		  pattern: '/'                // a string prefix or RegExp
		//, origins
		//, methods
		//, headers
		//, credentials
		}
	]
};