var Config = {
    DB_HOST:"ec2-52-34-157-130.us-west-2.compute.amazonaws.com",
    DB_NAME:"proglobe",
    RESULT_PER_PAGE:1000,
    SITE_PATH:"ec2-54-71-21-167.us-west-2.compute.amazonaws.com",
    SECRET:"4951965c-e128-424e-980a-710f42f928a6",
    CDN_BUCKET_NAME:'proglobe/',
    CDN_URL:"https://s3.amazonaws.com/proglobe/",

    //CDN_UPLOAD_PATH:"dev/",
    //Cache Configuration
    //CACHE_HOST:"ec2-35-163-3-63.us-west-2.compute.amazonaws.com",
    CACHE_HOST:"localhost",
    CACHE_PORT:"6379",
    CACHE_TTL:86400,

    DEFAULT_PROFILE_IMAGE:"/images/default-profile-pic.png",

    CONNECTION_RESULT_PER_PAGE:6,
    NOTIFICATION_RESULT_PER_PAGE:10,
    AWS_KEY:"AKIAJKNZZ63HCXAU5NFA",
    AWS_SECRET:"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",
    MAILER: {
        FROM: 'contact@proglobe.com',
        OPTIONS: {
            HOST: 'smtp.mandrillapp.com',
            SERVICE:'Mandrill',
            PORT:587,
            AUTH: {
                USER: 'sohamkhaitan@gmail.com',
                PASS: 'n_u1fn_slFgrKn3lPuTxuA'
            }
        }
    },

    //Elastic search configurations
    ES_HOST:"ec2-54-68-20-161.us-west-2.compute.amazonaws.com",
    ES_PORT:9200,
    API_KEY:"da8afb3a-8a0e-47ca-a90d-529449c0f9b6",
    PROGLOBE_NOTIFICATIONS:"https://notify.proglobe.local/"
}
module.exports = Config;
