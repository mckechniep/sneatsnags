import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Skeleton,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  EVENT_TYPES,
  EVENT_STATUSES,
  SORT_OPTIONS,
  DEFAULT_FILTERS,
} from "../../types/events";
import type {
  EventFilters,
  EventListProps,
  EventCardProps,
} from "../../types/events";
import { useEvents, useEventAdmin } from "../../contexts/EventContext";

// Event Card Component
const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelect,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(event.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "CANCELLED":
        return "error";
      case "POSTPONED":
        return "warning";
      case "COMPLETED":
        return "info";
      default:
        return "default";
    }
  };

  const isUpcoming =
    differenceInDays(parseISO(event.eventDate), new Date()) >= 0;
  const daysUntil = differenceInDays(parseISO(event.eventDate), new Date());

  return (
    <>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          transition: "all 0.2s ease",
          textDecoration: "none !important",
          borderRadius: 2,
          overflow: "hidden",
          border: "none",
          bgcolor: "background.paper",
          boxShadow:
            "0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transform: "translateY(-2px)",
            "& .event-image": {
              transform: "scale(1.02)",
            },
          },
          "& *": {
            textDecoration: "none !important",
            color: "inherit !important",
          },
          "& a": {
            textDecoration: "none !important",
            color: "inherit !important",
          },
          "& a:hover": {
            textDecoration: "none !important",
            color: "inherit !important",
          },
          "& a:focus": {
            textDecoration: "none !important",
            color: "inherit !important",
          },
          "& a:visited": {
            textDecoration: "none !important",
            color: "inherit !important",
          },
        }}
        onClick={() => onSelect(event)}
      >
        <Box
          className="event-image"
          sx={{
            height: 160,
            background: event.imageUrl
              ? `url(${event.imageUrl})`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            transition: "transform 0.3s ease",
            overflow: "hidden",
          }}
        >
          {event.status === "CANCELLED" && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: "white",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  transform: "rotate(-15deg)",
                  padding: "8px 24px",
                  border: "3px solid white",
                }}
              >
                Cancelled
              </Typography>
            </Box>
          )}

          {isUpcoming && daysUntil <= 7 && event.status !== "CANCELLED" && (
            <Box
              sx={{
                position: "absolute",
                top: 12,
                left: 12,
                bgcolor: "#f8f8f8",
                borderRadius: "4px",
                px: 1,
                py: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#39364f",
                }}
              >
                {daysUntil === 0 ? "Today" : `${daysUntil} days left`}
              </Typography>
            </Box>
          )}

          {showActions && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <IconButton
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 1)",
                  },
                  transition: "all 0.2s ease",
                  width: 32,
                  height: 32,
                }}
                onClick={handleMenuClick}
              >
                <MoreVertIcon sx={{ color: "text.primary", fontSize: 18 }} />
              </IconButton>
            </Box>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2, pb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#d1410c",
              fontWeight: 600,
              fontSize: "0.875rem",
              mb: 0.5,
            }}
          >
            {format(parseISO(event.eventDate), "EEE, MMM d • h:mm a")}
          </Typography>

          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              fontSize: "1rem",
              color: "#39364f",
              mb: 0.5,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.name}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#6f7287",
              fontSize: "0.875rem",
              mb: 1,
            }}
          >
            {event.venue} • {event.city}
          </Typography>

          {(event.minPrice > 0 || event.maxPrice > 0) && (
            <Typography
              variant="body2"
              sx={{
                color: "#39364f",
                fontWeight: 600,
                fontSize: "0.875rem",
                mb: 1,
              }}
            >
              {event.minPrice === 0
                ? "Free"
                : event.minPrice === event.maxPrice
                ? `From $${event.minPrice}`
                : `From $${event.minPrice}`}
            </Typography>
          )}

          <Box sx={{ mt: "auto", display: "flex", gap: 1, flexWrap: "wrap" }}>
            {event.category && (
              <Typography
                variant="caption"
                sx={{
                  color: "#6f7287",
                  fontSize: "0.75rem",
                }}
              >
                {event.category}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            onSelect(event);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <ViewIcon />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onEdit(event);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit Event</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon color="error" />
          </ListItemIcon>
          <ListItemText>Delete Event</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{event.name}"? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            color="error"
            variant="contained"
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Event Filters Component
const EventFilters: React.FC<{
  filters: EventFilters;
  onFiltersChange: (filters: Partial<EventFilters>) => void;
  onReset: () => void;
}> = ({ filters, onFiltersChange, onReset }) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === "search") return false; // Search is handled separately
      return value !== "" && value !== null && value !== undefined;
    });
  }, [filters]);

  return (
    <Card
      sx={{
        mb: 4,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <CardContent>
        <Box
          display="flex"
          gap={2}
          alignItems="center"
          mb={filtersOpen ? 2 : 0}
        >
          <TextField
            placeholder="Search events, venues, or locations..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "primary.main" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flexGrow: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                  borderWidth: 2,
                },
              },
            }}
          />

          <Button
            variant={hasActiveFilters ? "contained" : "outlined"}
            startIcon={<FilterIcon />}
            onClick={() => setFiltersOpen(!filtersOpen)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.2,
              ...(hasActiveFilters
                ? {
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.4)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                      boxShadow: "0 6px 24px rgba(102, 126, 234, 0.6)",
                    },
                  }
                : {
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.50",
                      borderColor: "primary.main",
                    },
                  }),
              transition: "all 0.2s ease",
            }}
          >
            Filters{" "}
            {hasActiveFilters &&
              `(${
                Object.values(filters).filter((v) => v !== "" && v !== null)
                  .length - 1
              })`}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={onReset}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                py: 1.2,
                borderColor: "error.main",
                color: "error.main",
                "&:hover": {
                  bgcolor: "error.50",
                  borderColor: "error.main",
                },
                transition: "all 0.2s ease",
              }}
            >
              Clear
            </Button>
          )}
        </Box>

        {filtersOpen && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            <Box>
              <TextField
                fullWidth
                label="City"
                value={filters.city}
                onChange={(e) => onFiltersChange({ city: e.target.value })}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="State"
                value={filters.state}
                onChange={(e) => onFiltersChange({ state: e.target.value })}
              />
            </Box>

            <Box>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.eventType}
                  onChange={(e) =>
                    onFiltersChange({
                      eventType: e.target.value as EventFilters["eventType"],
                    })
                  }
                  label="Event Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {EVENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) =>
                    onFiltersChange({
                      status: e.target.value as EventFilters["status"],
                    })
                  }
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {EVENT_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{ bgcolor: `${status.color}.main`, color: "white" }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) =>
                  onFiltersChange({
                    minPrice: parseFloat(e.target.value) || "",
                  })
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) =>
                  onFiltersChange({
                    maxPrice: parseFloat(e.target.value) || "",
                  })
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Main Event List Component
const EventList: React.FC<EventListProps> = ({
  events,
  loading,
  error,
  onEventSelect,
  onEventEdit,
  onEventDelete,
  onLoadMore,
  hasMore,
}) => {
  const { state, actions } = useEvents();
  const { isAdmin } = useEventAdmin();
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const handleSortMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    actions.setSorting(
      sortBy as
        | "name"
        | "minPrice"
        | "maxPrice"
        | "eventDate"
        | "createdAt"
        | "popularity",
      sortOrder
    );
    handleSortMenuClose();
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    actions.loadEvents({ page });
  };

  const handleRefresh = () => {
    actions.loadEvents();
  };

  // Loading skeleton
  if (loading && events.length === 0) {
    return (
      <Box>
        <EventFilters
          filters={state.filters}
          onFiltersChange={actions.setFilters}
          onReset={() => actions.setFilters(DEFAULT_FILTERS)}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
            px: { xs: 1, sm: 2, md: 0 },
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <Box key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} width="80%" />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Skeleton variant="text" height={20} width="40%" />
                  <Box display="flex" gap={1} mt={2}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="rectangular" width={80} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fafafa",
        backgroundImage: {
          xs: "none",
          md: "radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)",
        },
        pb: 6,
      }}
    >
      {/* Filters */}
      <EventFilters
        filters={state.filters}
        onFiltersChange={actions.setFilters}
        onReset={() => actions.setFilters(DEFAULT_FILTERS)}
      />

      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: "background.paper",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "1.75rem", sm: "2.125rem", md: "2.5rem" },
              letterSpacing: "-0.02em",
            }}
          >
            Discover Events
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: "1rem",
              fontWeight: 500,
              mb: 1,
            }}
          >
            {state.pagination.total > 0
              ? `Showing ${
                  (state.pagination.page - 1) * state.pagination.limit + 1
                }-${Math.min(
                  state.pagination.page * state.pagination.limit,
                  state.pagination.total
                )} of ${state.pagination.total} events`
              : "No events found"}
          </Typography>
        </Box>

        <Box display="flex" gap={2} alignItems="center">
          <Tooltip title="Refresh events" arrow>
            <IconButton
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                bgcolor: "background.paper",
                border: "2px solid",
                borderColor: "divider",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                "&:hover": {
                  bgcolor: "primary.50",
                  borderColor: "primary.main",
                  transform: "scale(1.05)",
                },
                "&:disabled": {
                  bgcolor: "grey.100",
                },
                transition: "all 0.2s ease",
              }}
            >
              <RefreshIcon
                sx={{ color: loading ? "grey.400" : "primary.main" }}
              />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<SortIcon />}
            onClick={handleSortMenuClick}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 4px 16px rgba(102, 126, 234, 0.4)",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              py: 1,
              "&:hover": {
                background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                boxShadow: "0 6px 24px rgba(102, 126, 234, 0.6)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Sort:{" "}
            {SORT_OPTIONS.find((opt) => opt.value === state.sortBy)?.label ||
              "Name"}
            {state.sortOrder === "desc" ? " ↓" : " ↑"}
          </Button>
        </Box>
      </Box>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortMenuClose}
      >
        {SORT_OPTIONS.map((option) => (
          <React.Fragment key={option.value}>
            <MenuItem
              onClick={() => handleSortChange(option.value as string, "asc")}
            >
              {option.label} (A-Z / Low-High)
            </MenuItem>
            <MenuItem
              onClick={() => handleSortChange(option.value as string, "desc")}
            >
              {option.label} (Z-A / High-Low)
            </MenuItem>
          </React.Fragment>
        ))}
      </Menu>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Events Grid */}
      {events.length > 0 ? (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
              px: { xs: 1, sm: 2, md: 0 },
            }}
          >
            {events.map((event) => (
              <Box key={event.id}>
                <EventCard
                  event={event}
                  onSelect={onEventSelect}
                  onEdit={onEventEdit}
                  onDelete={onEventDelete}
                  showActions={isAdmin}
                />
              </Box>
            ))}
          </Box>

          {/* Pagination */}
          {state.pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={state.pagination.totalPages}
                page={state.pagination.page}
                onChange={handlePageChange}
                disabled={loading}
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Load More Button (alternative to pagination) */}
          {onLoadMore && hasMore && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                disabled={loading}
                onClick={onLoadMore}
                variant="outlined"
                size="large"
              >
                {loading ? "Loading..." : "Load More Events"}
              </Button>
            </Box>
          )}
        </>
      ) : (
        !loading && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={12}
            sx={{
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              borderRadius: 4,
              mx: { xs: 1, sm: 2, md: 0 },
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
                boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
              }}
            >
              <EventIcon sx={{ fontSize: 48, color: "white" }} />
            </Box>
            <Typography
              variant="h4"
              color="text.primary"
              gutterBottom
              sx={{
                fontWeight: 700,
                textAlign: "center",
                mb: 2,
              }}
            >
              No events found
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              mb={4}
              sx={{
                maxWidth: 400,
                fontSize: "1.125rem",
                lineHeight: 1.6,
              }}
            >
              {Object.values(state.filters).some((v) => v !== "" && v !== null)
                ? "Try adjusting your filters to discover amazing events in your area."
                : "Check back soon for exciting upcoming events!"}
            </Typography>
            {Object.values(state.filters).some(
              (v) => v !== "" && v !== null
            ) && (
              <Button
                variant="contained"
                onClick={() => actions.setFilters(DEFAULT_FILTERS)}
                size="large"
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.4)",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                    boxShadow: "0 6px 24px rgba(102, 126, 234, 0.6)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Clear All Filters
              </Button>
            )}
          </Box>
        )
      )}

      {/* Loading overlay for subsequent loads */}
      {loading && events.length > 0 && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(255, 255, 255, 0.8)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          <Typography>Loading events...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default EventList;
