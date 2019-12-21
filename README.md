# Models / Collections

## ad-creative-trackers
- no ddt data

## ad-creatives
- no ddt data

## behavior-entities
- no ddt data

## behavior-views
- no ddt data

## campaigns
- 314 ddt records
- relationships
  - customerId
    - 64 distinct customerIds
  - email.tagIds
    - 0 distinct tagIds
  - email.excludeUrls.urlId
    - 6 campaigns with this field set
  - email.excludeUrls.sendId
    - 6 campaigns with this field set
  - forms.excludeFormIds
    - 0 distinct formIds
  - ads.tagIds
    - 0 distinct tagIds
  - ads.excludeTrackerIds
    - 0 distinct tracker ids
- models that reference this
  - identity (can be ignored, no data)

## click-requests
- can likely ignore

## content-query-results
- can ignore

## customers
- 239 ddt records
- unique index on `key` field (when not deleted)
- when a duplicate key is found, merge with IEN customer
- models that reference this
  - campaign
  - extracted-host
  - extracted-url
  - form (can be ignored, no data)
  - identity (can be ignored, no data)
  - order

## email-categories
- 22 ddt records
- externalSource.identifier values will need to be handled for DDT BU
- relationships
  - parentId
    - 21 categories with this field set
    - 6 distinct categoryIds
- models that reference this
  - email-category
  - email-deployment
  - email-send-url
  - line-item (can be ignored, no data)

## email-deployments
- 721 ddt records
- externalSource.identifier values will need to be handled for DDT BU
- relationships
  - categoryId
    - 721 deployments with this field set
    - 20 distinct categoryIds
- models that reference this
  - email-send-url
  - email-send

# email-send-urls
- 31,230 ddt records
- unique key on sendId, urlId
- relationships
  - deploymentId
    - 721 distinct deploymentIds
  - sendId
    - 1,307 distinct sendIds
  - categoryId
    - 9 distinct categoryIds
  - urlId
    - 5,114 distinct urlIds

# email-sends
- 1,308 ddt records
- externalSource.identifier values will need to be handled for DDT BU
- relationships
  - deploymentId
    - 721 distinct deploymentIds
- models that reference this
  - campaign
  - email-send-url
  - event-email-click
  - line-item (can be ignored, no data)

# errors
- can likely ignore

# event-ad-creatives
- no ddt data

# event-email-clicks
- 458,689 ddt records
- unique index on `day`, `job`, `url`, `usr`
- relationships
  - url (extractedUrlId)
  - usr (identityId)
  - job (sendId)

# excluded-email-domains
- no ddt data

# extracted-hosts
- 129 ddt records
- unique index on `value`
- relationships
  - customerId
    - 14 hosts with this field set
    - 14 distinct customerIds
  - tagIds
    - 0 hosts with this field set
- models that reference this
  - extracted-url

## extracted-urls
- 6,137 ddt records
- unique index on `shortId`
- unique index on `values.original`
- relationships
  - resolvedHostId
    - all urls have this field set
    - 113 distinct hostIds
  - customerId
    - 904 urls with this field set
    - 234 distinct customerIds
  - tagIds
    - 4,649 urls with this field set
- models that reference this
  - campaign
  - email-send-url
  - event-email-click
  - line-item (can ignore, no data)
  - url-acknowledgment

## form-entries
- no ddt data

## forms
- no ddt data

## honey-pots
- can likely ignore

# identities
- 21,871 ddt records
- externalSource.identifier values will need to be handled for DDT BU
- need to determine how to handle "duplicate" email addresses
- relationships
  - inactiveCustomerIds
    - 0 records
  - inactiveCampaignIds
    - 0 records
  - inactiveLineItemIds
    - 0 records
- models that reference this
  - event-email-click

# line-items
- 3 ddt records
- relationships
  - orderId
    - 3 records
    - 3 distinct orderIds
  - categoryIds
    - 0 records
  - tagIds
    - 0 records
  - excludedUrls.urlId
    - 0 records
  - excludedUrls.sendId
    - 0 records
- models that reference this
  - identity (can ignore, no data)

# orders
- 3 ddt records
- relationships
  - customerId
    - 3 records
    - 3 distinct customerIds
  - salesRepId (userId)
    - 3 records
    - 2 distinct userIds
- models that reference this
  - line-item

# pings
- can ignore

# tags
- 5 ddt records
- unique index on `name` (when not deleted)
- models that reference this
  - campaign (can ignore, no data)
  - extracted-host (can ignore, no data)
  - extracted-url
  - line-item (can ignore, no data)

# tracked-campaigns
- no ddt data

# url-acknowledgments
- 757 ddt records
- unique index on `shortId`
- relationships
  - urlIds

# users
- 18 ddt records
- unique index on `email` (when not deleted)
- merge with ien records
- models that reference this
  - order

# videos
- no ddt data
