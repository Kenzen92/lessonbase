import React from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import StarIcon from "@mui/icons-material/Star";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out LessonBase",
    cta: "Get Started",
    ctaPath: "/signup",
    featured: false,
    features: [
      "Up to 30 students",
      "Basic class management",
      "Standard assignments",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For teachers who want more power",
    cta: "Start Pro Trial",
    ctaPath: "/signup",
    featured: true,
    features: [
      "Unlimited students",
      "Advanced class analytics",
      "Unlimited assignments & resources",
      "Interactive classroom tools",
      "Priority email support",
      "Custom branding",
    ],
  },
  {
    name: "School",
    price: "Custom",
    period: "",
    description: "For schools and districts",
    cta: "Contact Sales",
    ctaPath: "/signup",
    featured: false,
    features: [
      "Everything in Pro",
      "Admin dashboard",
      "School-wide analytics",
      "SSO / SAML integration",
      "Dedicated account manager",
      "Custom training & onboarding",
      "SLA & uptime guarantee",
    ],
  },
];

function Pricing() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(0deg, rgba(0,28,91,1) 0%, rgba(9,85,121,1) 52%, rgba(0,212,255,1) 100%)",
        color: "white",
        py: 8,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "2.5rem", md: "3.5rem" } }}>
            Simple, transparent pricing
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.85, maxWidth: 600, mx: "auto" }}>
            Choose the plan that fits your teaching needs. Upgrade or downgrade at any time.
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center" sx={{ mb: 6 }}>
          {plans.map((plan) => (
            <Grid item xs={12} sm={6} md={3.5} key={plan.name}>
              <Card
                sx={{
                  bgcolor: plan.featured ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                  border: plan.featured ? "2px solid" : "1px solid",
                  borderColor: plan.featured ? "primary.main" : "rgba(255,255,255,0.2)",
                  borderRadius: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                {plan.featured && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -14,
                      left: "50%",
                      transform: "translateX(-50%)",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    <StarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                    Most Popular
                  </Box>
                )}

                <CardContent sx={{ pb: 2, flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {plan.name}
                    </Typography>
                    {plan.name === "School" && (
                      <Chip label="Enterprise" size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white" }} />
                    )}
                  </Stack>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {plan.price}
                    </Typography>
                    {plan.period && (
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        {plan.period}
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>
                    {plan.description}
                  </Typography>

                  <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", mb: 3 }} />

                  <List dense>
                    {plan.features.map((feature) => (
                      <ListItem key={feature} dense sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ color: "primary.light", mr: 1 }}>
                          <CheckIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{ variant: "body2", sx: { opacity: 0.9 } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={plan.featured ? "contained" : "outlined"}
                    color={plan.featured ? "primary" : "inherit"}
                    component={Link}
                    to={plan.ctaPath}
                    sx={{ py: 1.2, fontWeight: 600 }}
                  >
                    {plan.cta}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center">
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            All plans include a 14-day free trial. No credit card required.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Pricing;
