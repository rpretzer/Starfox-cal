import 'package:flutter/material.dart';
import 'package:starfox_calendar/utils/constants.dart';

class RepresentationStrategyCard extends StatelessWidget {
  const RepresentationStrategyCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(AppConstants.defaultPadding),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        side: BorderSide(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
          width: 1,
        ),
      ),
      color: Theme.of(context).colorScheme.primary.withOpacity(0.05),
      child: ExpansionTile(
        title: Text(
          AppConstants.representationStrategy,
          style: TextStyle(
            color: Theme.of(context).colorScheme.primary,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: Icon(
          Icons.people_alt,
          color: Theme.of(context).colorScheme.primary,
        ),
        childrenPadding: const EdgeInsets.fromLTRB(
          AppConstants.largePadding,
          0,
          AppConstants.defaultPadding,
          AppConstants.defaultPadding,
        ),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ...AppConstants.representationStrategyPoints.map((point) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('• '),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: DefaultTextStyle.of(context).style,
                        children: [
                          TextSpan(
                            text: '${point['title']}: ',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          TextSpan(
                            text: point['content'],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }
}
